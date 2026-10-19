-- specs/data/spec.md — one row per prayer time, sourced from MORA.
-- Future data-analysis reads this table directly.

create table if not exists public.prayer_times (
  prayer_date date not null,
  district text not null default 'bruneiMuara'
    check (district in ('bruneiMuara', 'temburong', 'tutong', 'belait')),
  prayer text not null
    check (prayer in ('imsak', 'subuh', 'syuruk', 'doha', 'zuhur', 'asar', 'maghrib', 'isyak')),
  time time not null,
  hijri_date text not null default '',
  source_url text not null,
  updated_at timestamptz not null default now(),
  primary key (prayer_date, district, prayer)
);

create index if not exists prayer_times_date_idx
  on public.prayer_times (prayer_date);

alter table public.prayer_times enable row level security;

-- Public read for the app and any future analysis surface; writes are
-- service-role only (the importer), which bypasses RLS.
drop policy if exists "prayer_times public read" on public.prayer_times;
create policy "prayer_times public read"
  on public.prayer_times for select
  using (true);
