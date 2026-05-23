-- Phase B 후속: Supabase advisor WARN 해소
-- 1) function_search_path_mutable: set_updated_at 함수의 search_path 고정
-- 2) auth_rls_initplan: RLS 정책의 auth.jwt() 호출을 (select ...)로 감싸 statement 단위 캐싱

-- 1) 함수 재정의 (search_path 고정, security definer 아님 유지)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) 정책 재정의 (auth.jwt() → (select auth.jwt()) 래핑)
drop policy if exists "own row select" on public.applications;
create policy "own row select"
  on public.applications for select
  to authenticated
  using ((select auth.jwt() ->> 'email') = email);

drop policy if exists "own row insert" on public.applications;
create policy "own row insert"
  on public.applications for insert
  to authenticated
  with check ((select auth.jwt() ->> 'email') = email);

drop policy if exists "own row update" on public.applications;
create policy "own row update"
  on public.applications for update
  to authenticated
  using ((select auth.jwt() ->> 'email') = email)
  with check ((select auth.jwt() ->> 'email') = email);
