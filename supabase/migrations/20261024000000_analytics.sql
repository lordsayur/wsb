-- specs/analytics/spec.md — cookieless, first-party pageviews.
-- The browser (anon key) may only insert; every read goes through
-- analytics_stats, which re-checks the allowlist against the caller's JWT.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  day date not null generated always as
    ((occurred_at at time zone 'Asia/Brunei')::date) stored,
  environment text not null
    check (environment in ('production', 'preview', 'development')),
  session_id text not null check (char_length(session_id) between 8 and 64),
  path text not null
    check (char_length(path) between 1 and 200 and path not like '/admin%'),
  event text not null check (event in ('pageview')),
  props jsonb not null default '{}'::jsonb
    check (jsonb_typeof(props) = 'object' and pg_column_size(props) < 1024),
  locale text not null check (char_length(locale) between 1 and 8),
  device text not null check (device in ('mobile', 'tablet', 'desktop')),
  referrer_host text check (char_length(referrer_host) <= 100)
);

create index if not exists analytics_events_day_idx
  on public.analytics_events (day);
create index if not exists analytics_events_event_day_idx
  on public.analytics_events (event, day);
create index if not exists analytics_events_path_day_idx
  on public.analytics_events (path, day);

alter table public.analytics_events enable row level security;

-- Supabase grants all on new public tables by default; take it back first.
revoke all on public.analytics_events from anon, authenticated;
grant insert on public.analytics_events to anon;

drop policy if exists "analytics_events insert" on public.analytics_events;
create policy "analytics_events insert"
  on public.analytics_events for insert
  to anon
  with check (true);

-- Per-day rollup that survives the 90-day raw prune. Service-role only.
create table if not exists public.analytics_daily (
  day date not null,
  environment text not null,
  path text not null,
  event text not null,
  views bigint not null default 0,
  sessions bigint not null default 0,
  primary key (day, environment, path, event)
);

alter table public.analytics_daily enable row level security;
revoke all on public.analytics_daily from anon, authenticated;

-- Copies raw counts for days before p_before into the rollup. Run it before
-- pruning; raising p_before never rewrites a day already rolled up.
-- ponytail: manual monthly job, upgrade path is pg_cron when enabled.
create or replace function public.analytics_rollup(p_before date default current_date)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.analytics_daily (day, environment, path, event, views, sessions)
  select day, environment, path, event, count(*), count(distinct session_id)
  from public.analytics_events
  where day < p_before
  group by day, environment, path, event
  on conflict (day, environment, path, event) do update
    set views = excluded.views, sessions = excluded.sessions;
$$;

revoke all on function public.analytics_rollup(date) from public, anon, authenticated;

-- specs/analytics/spec.md — the admin dashboard's only read path.
-- Raises before touching the table unless the caller is allowlisted.
create or replace function public.analytics_stats(
  days int default 30,
  environment text default 'production'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller text := lower(coalesce(auth.jwt() ->> 'email', ''));
  since date;
  prev_since date;
  target text := environment;
  include_all boolean := environment = 'all';
begin
  if caller = '' or not exists (
    select 1 from public.admin_allowlist a where a.email = caller
  ) then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  if days is null or days < 1 or days > 365 then
    raise exception 'invalid_parameter_value' using errcode = '22023';
  end if;

  if environment not in ('production', 'preview', 'development', 'all') then
    raise exception 'invalid_parameter_value' using errcode = '22023';
  end if;

  since := current_date - (days - 1);
  prev_since := current_date - (2 * days - 1);

  return (
    with rows as (
      select e.*
      from public.analytics_events e
      where e.day >= prev_since
        and e.day <= current_date
        and (include_all or e.environment = target)
    ),
    current_rows as (
      select * from rows r where r.day >= since
    ),
    previous_rows as (
      select * from rows r where r.day < since
    ),
    daily as (
      select d::date as day,
        (select count(*) from current_rows r where r.day = d::date) as views,
        (select count(distinct r.session_id) from current_rows r where r.day = d::date)
          as sessions
      from generate_series(since, current_date, interval '1 day') d
    ),
    top_paths as (
      select r.path, count(*) as views
      from current_rows r
      where r.event = 'pageview'
      group by r.path
      order by views desc, r.path
      limit 10
    ),
    event_counts as (
      select r.event, count(*) as views
      from current_rows r
      group by r.event
      order by views desc, r.event
    ),
    locales as (
      select r.locale, count(*) as views
      from current_rows r
      where r.event = 'pageview'
      group by r.locale
      order by views desc, r.locale
      limit 10
    ),
    devices as (
      select r.device, count(*) as views
      from current_rows r
      where r.event = 'pageview'
      group by r.device
      order by views desc, r.device
    ),
    referrers as (
      select r.referrer_host, count(*) as views
      from current_rows r
      where r.event = 'pageview'
      group by r.referrer_host
      order by views desc, r.referrer_host nulls last
      limit 10
    )
    select jsonb_build_object(
      'totals', jsonb_build_object(
        'views', (select count(*) from current_rows),
        'sessions', (select count(distinct session_id) from current_rows)
      ),
      'previous', jsonb_build_object(
        'views', (select count(*) from previous_rows),
        'sessions', (select count(distinct session_id) from previous_rows)
      ),
      'days', coalesce(
        (select jsonb_agg(jsonb_build_object(
          'day', d.day, 'views', d.views, 'sessions', d.sessions
        ) order by d.day) from daily d),
        '[]'::jsonb
      ),
      'topPaths', coalesce(
        (select jsonb_agg(jsonb_build_object('path', p.path, 'views', p.views))
         from top_paths p),
        '[]'::jsonb
      ),
      'events', coalesce(
        (select jsonb_agg(jsonb_build_object('event', c.event, 'views', c.views))
         from event_counts c),
        '[]'::jsonb
      ),
      'locales', coalesce(
        (select jsonb_agg(jsonb_build_object('locale', l.locale, 'views', l.views))
         from locales l),
        '[]'::jsonb
      ),
      'devices', coalesce(
        (select jsonb_agg(jsonb_build_object('device', v.device, 'views', v.views))
         from devices v),
        '[]'::jsonb
      ),
      'referrers', coalesce(
        (select jsonb_agg(jsonb_build_object(
          'referrerHost', f.referrer_host, 'views', f.views
        )) from referrers f),
        '[]'::jsonb
      )
    )
  );
end;
$$;

revoke all on function public.analytics_stats(int, text) from public;
-- anon may call it only to be rejected: the allowlist check raises first.
grant execute on function public.analytics_stats(int, text) to anon, authenticated;

-- Retention: raw rows have no automatic expiry.
-- ponytail: manual monthly prune until pg_cron is enabled:
--   select public.analytics_rollup(current_date - 90);
--   delete from public.analytics_events where day < current_date - 90;
