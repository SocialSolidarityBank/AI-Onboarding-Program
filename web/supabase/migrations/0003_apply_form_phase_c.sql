-- Phase C: 신청 폼 운영 카피·구조 변경에 따른 스키마 갱신
--
-- 변경 항목
--   1. program_id (text)        → program_ids (text[])   다중 선택
--   2. expectations (text[])    → expectations (text)    주관식 한 문장
--   3. difficult_days           → available_days         의미 반전 (이름만 변경)
--   4. learning_goals (text[])  신규 컬럼 (Phase D에서 옵션 확정 예정)
--
-- 적용 시점에 production rows = 0 이므로 데이터 보존을 위한 마이그레이션
-- 구문은 생략. 운영 데이터가 이미 적재된 환경이라면 본 파일을 실행하기
-- 전에 별도의 ALTER + UPDATE 절을 추가해야 함.

-- 1) program_id (text) → program_ids (text[])
alter table public.applications
  add column if not exists program_ids text[] not null default '{}';

drop index if exists public.applications_program_id_idx;

alter table public.applications
  drop column if exists program_id;

create index if not exists applications_program_ids_idx
  on public.applications using gin (program_ids);

-- 2) expectations (text[]) → expectations (text)
alter table public.applications
  drop column if exists expectations;

alter table public.applications
  add column expectations text;

-- 3) difficult_days → available_days (의미 반전, 컬럼 자체는 rename)
alter table public.applications
  rename column difficult_days to available_days;

-- 4) learning_goals 신규 (Phase D에서 옵션 확정)
alter table public.applications
  add column if not exists learning_goals text[] not null default '{}';
