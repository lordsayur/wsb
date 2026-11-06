-- specs/notifications/spec.md — admin-authored announcements.
-- Anyone may read an announcement; only the `admin` Edge Function (service
-- role) writes them, and it checks the allowlist before every write.

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  published_at timestamptz not null default now(),
  expires_at timestamptz,
  link text not null default '' check (char_length(link) <= 500),
  -- { "ms": { "title": "...", "body": "..." }, ... }; Malay is required.
  messages jsonb not null check (
    jsonb_typeof(messages) = 'object'
    and messages ? 'ms'
    and jsonb_typeof(messages -> 'ms' -> 'title') = 'string'
    and jsonb_typeof(messages -> 'ms' -> 'body') = 'string'
    and char_length(messages -> 'ms' ->> 'title') between 1 and 120
    and char_length(messages -> 'ms' ->> 'body') between 1 and 2000
    and pg_column_size(messages) <= 32768
  ),
  created_at timestamptz not null default now()
);

create index if not exists announcements_published_at_idx
  on public.announcements (published_at desc);

alter table public.announcements enable row level security;

-- Read-only to the world: the page must work without a session.
drop policy if exists "announcements public read" on public.announcements;
create policy "announcements public read"
  on public.announcements for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.announcements from anon, authenticated;

grant select on public.announcements to anon, authenticated;
-- The `admin` Edge Function writes with the service role after checking the
-- allowlist, so it needs the full grant.
grant select, insert, update, delete on public.announcements to service_role;
