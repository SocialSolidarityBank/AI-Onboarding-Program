-- Phase B: 신청 데이터 적재 테이블
-- 정책: 인증된 사용자(magic link)는 자신의 email row만 select/insert/update
-- upsert: 같은 email 재제출은 update로 처리

create extension if not exists "uuid-ossp";

create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text not null,
  team text not null,
  program_id text not null,
  tools text[] not null default '{}',
  tools_other text,
  expectations text[] not null default '{}',
  difficult_days text[] not null default '{}',
  level_check_response_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_program_id_idx on public.applications (program_id);
create index if not exists applications_created_at_idx on public.applications (created_at desc);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_applications_updated_at on public.applications;
create trigger trg_applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- RLS
alter table public.applications enable row level security;

-- 본인 row 읽기
drop policy if exists "own row select" on public.applications;
create policy "own row select"
  on public.applications for select
  to authenticated
  using ((auth.jwt() ->> 'email') = email);

-- 본인 row 삽입 (email은 jwt와 일치해야 함)
drop policy if exists "own row insert" on public.applications;
create policy "own row insert"
  on public.applications for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') = email);

-- 본인 row 업데이트 (재신청 = upsert)
drop policy if exists "own row update" on public.applications;
create policy "own row update"
  on public.applications for update
  to authenticated
  using ((auth.jwt() ->> 'email') = email)
  with check ((auth.jwt() ->> 'email') = email);
