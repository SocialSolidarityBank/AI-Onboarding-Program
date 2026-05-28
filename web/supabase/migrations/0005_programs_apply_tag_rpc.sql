-- 0005: 선택된 (program_id, basis) 행들에 태그를 원자적으로 추가/제거하는 RPC.
-- 전체 배열 덮어쓰기 대신 append/remove → 여러 운영자가 동시에 태깅해도 서로 안 덮어씀.
-- SECURITY INVOKER → 호출자 RLS(operators만 UPDATE, 0004) 그대로 적용.
-- (Supabase에 이미 적용됨 — 소스 오브 트루스 동기화용 체크인 파일)

create or replace function public.programs_apply_tag(
  p_keys jsonb,   -- [{"id":"...","basis":"report"}, ...]
  p_tag  text,
  p_op   text     -- 'add' | 'remove'
)
returns integer
language plpgsql
security invoker
as $$
declare
  v_tag text := btrim(p_tag);
  v_count integer := 0;
begin
  if v_tag = '' or v_tag is null then
    raise exception '빈 태그는 저장할 수 없습니다';
  end if;
  if p_op not in ('add','remove') then
    raise exception '잘못된 작업: %', p_op;
  end if;

  if p_op = 'add' then
    update public.programs p
      set tags = (
        select array(select distinct e
                     from unnest(coalesce(p.tags, '{}') || array[v_tag]) as e)
      )
    from jsonb_to_recordset(p_keys) as k(id text, basis text)
    where p.program_id = k.id and p.basis = k.basis
      and not (coalesce(p.tags, '{}') @> array[v_tag]);  -- 이미 있으면 skip
  else
    update public.programs p
      set tags = nullif(array_remove(coalesce(p.tags, '{}'), v_tag), '{}')
    from jsonb_to_recordset(p_keys) as k(id text, basis text)
    where p.program_id = k.id and p.basis = k.basis
      and coalesce(p.tags, '{}') @> array[v_tag];
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- anon은 호출 불가, 로그인 사용자만 (실제 권한은 SECURITY INVOKER + RLS가 결정)
revoke execute on function public.programs_apply_tag(jsonb, text, text) from public, anon;
grant execute on function public.programs_apply_tag(jsonb, text, text) to authenticated;
