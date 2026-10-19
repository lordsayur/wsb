-- specs/data/spec.md — admin allowlist for the `admin` Edge Function.
-- Google sign-in happens in the web shell; the function holds the service-role
-- key and checks this list on every call. The CLI importer is unaffected.

create table if not exists public.admin_allowlist (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.admin_allowlist enable row level security;

-- A signed-in user may read only their own row, so the page can show whether
-- the account is authorized. Adding/removing admins is service-role only
-- (Supabase dashboard for now); no insert/update/delete policy exists.
drop policy if exists "admin_allowlist self read" on public.admin_allowlist;
create policy "admin_allowlist self read"
  on public.admin_allowlist for select
  to authenticated
  using (email = lower(coalesce(auth.jwt() ->> 'email', '')));

revoke insert, update, delete on public.admin_allowlist from anon, authenticated;

insert into public.admin_allowlist (email)
values ('mohammad.omar.317@gmail.com')
on conflict (email) do nothing;
