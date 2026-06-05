-- 0004: operators가 programs의 운영 컬럼(tags, notes_internal, category_std)만 수정 가능하도록 허용.
-- 원본 '사실' 컬럼은 BEFORE UPDATE 트리거로 OLD 값에 고정해 변경을 무력화한다.
-- (Supabase에 이미 적용됨 — 소스 오브 트루스 동기화용 체크인 파일)

-- 1) operators만 UPDATE 가능 (행 단위 권한; 컬럼 보호는 아래 트리거가 담당)
create policy "operator update programs" on public.programs
  for update
  using (
    exists (
      select 1 from public.operators
      where operators.email = (select auth.jwt() ->> 'email')
    )
  )
  with check (
    exists (
      select 1 from public.operators
      where operators.email = (select auth.jwt() ->> 'email')
    )
  );

-- 2) 사실 컬럼 변경 차단 트리거: tags/notes_internal/category_std 외 모든 컬럼을 OLD로 되돌림.
--    (RLS는 컬럼 단위 제한을 못 하므로 트리거로 강제)
create or replace function public.programs_guard_fact_columns()
returns trigger
language plpgsql
as $$
begin
  new.program_id      := old.program_id;
  new.basis           := old.basis;
  new.report_year     := old.report_year;
  new.performance_year:= old.performance_year;
  new.area_code       := old.area_code;
  new.area_name       := old.area_name;
  new.program_name    := old.program_name;
  new.period          := old.period;
  new.headline_value  := old.headline_value;
  new.headline_unit   := old.headline_unit;
  new.headline_note   := old.headline_note;
  new.budget_krw      := old.budget_krw;
  new.target          := old.target;
  new.support_type    := old.support_type;
  new.source_document := old.source_document;
  new.source_pages    := old.source_pages;
  new.memo            := old.memo;
  new.funders         := old.funders;
  new.details         := old.details;
  new.kpis            := old.kpis;
  new.created_at      := old.created_at;
  new.updated_at      := now();
  return new;
end;
$$;

drop trigger if exists trg_programs_guard_fact_columns on public.programs;
create trigger trg_programs_guard_fact_columns
  before update on public.programs
  for each row execute function public.programs_guard_fact_columns();
