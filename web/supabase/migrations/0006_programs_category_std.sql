-- 0006: 표준분류(category_std)를 area_name 매핑으로 채우고, tags에 잘못 저장된 표준분류를 제거.
-- 레이어 모델: 원본 분류=area_name(보호·불변), 표준분류=category_std(단일·교체 가능).
-- (id,basis) 키로 category_std를 '치환'하는 RPC 추가. 트리거(0004)는 category_std/tags 수정 허용.
-- (Supabase에 이미 적용됨 — 소스 오브 트루스 동기화용 체크인 파일)

alter table public.programs add column if not exists category_std text;

-- area_name → 표준 4분류 백필 (위→아래 우선순위; 먼저 매칭된 분기 채택)
update public.programs p set category_std = case
  when p.area_name in (
    '소상공인 지원 (원장)','소상공인 지원사업',
    '마이크로크레딧을 통한 포용적 금융 접근성 강화','마이크로크레딧 - 소상공인 지원'
  ) then '소상공인 지원'

  when p.area_name in (
    '세대별 맞춤 자립 지원','청년통합 지원 (원장)','청년통합 지원사업',
    '자립준비청년의 지속가능한 자립','미래세대 지원 (청년)','금융 위기 극복과 경제적 회복',
    '사회 취약계층 지원','사회적취약계층 지원 (원장)','사회취약계층 지원사업','연구소 (원장)'
  ) or p.area_name like 'Discover Your Alpha%' then '세대별 맞춤 지원'

  when p.area_name in (
    '사회혁신 생태계 조성','사회혁신조직 지원사업','사회혁신조직 지원 (원장)',
    '사회혁신·사회적 경제 생태계 조성','사회혁신조직 지원'
  ) then '사회 혁신 조직 지원'

  -- 지역계열: 복지시설/생보위/생명보험사회공헌은 공익, 그 외(지역청년·로컬자립·소셜취업)는 사회혁신
  when p.area_name in ('지역 활성화 및 공익활동 생태계 강화','지역기반 사회적 가치 창출')
    and p.program_name not like '%복지시설%'
    and p.program_name not like '%생명보험사회공헌%'
    and p.program_name not like '%생보위%'
    then '사회 혁신 조직 지원'

  when p.area_name in ('공익 인프라 확충','공익인프라 확충') then '공익 인프라 지원'

  when p.area_name in ('지역 활성화 및 공익활동 생태계 강화','지역기반 사회적 가치 창출')
    and (p.program_name like '%복지시설%'
      or p.program_name like '%생명보험사회공헌%'
      or p.program_name like '%생보위%')
    then '공익 인프라 지원'

  else category_std  -- 매핑 밖이면 기존값 유지
end;

-- tags는 표준분류 용도로 더는 쓰지 않음 (지난 세션 잘못 넣은 값 제거)
update public.programs set tags = null where tags is not null;

-- 표준분류 치환 RPC (단일값 REPLACE; skip 절 없음 → row_count 정확)
create or replace function public.programs_set_category(
  p_keys     jsonb,   -- [{"id":"...","basis":"report"}, ...]
  p_category text     -- 4분류 중 하나, 또는 NULL/'' → 분류 해제
)
returns integer
language plpgsql
security invoker
as $$
declare
  v_cat   text := nullif(btrim(p_category), '');
  v_count integer := 0;
begin
  if v_cat is not null and v_cat not in (
    '소상공인 지원','세대별 맞춤 지원','사회 혁신 조직 지원','공익 인프라 지원'
  ) then
    raise exception '허용되지 않은 표준분류: %', v_cat;
  end if;

  update public.programs p
    set category_std = v_cat
  from jsonb_to_recordset(p_keys) as k(id text, basis text)
  where p.program_id = k.id and p.basis = k.basis;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.programs_set_category(jsonb, text) from public, anon;
grant execute on function public.programs_set_category(jsonb, text) to authenticated;
