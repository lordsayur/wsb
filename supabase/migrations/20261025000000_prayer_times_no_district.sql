-- specs/data/spec.md — store Brunei & Muara base times only; one row per
-- (prayer_date, prayer). Other districts stay a core offset, not stored rows.

-- Only the base district is kept; other rows were never populated anyway.
delete from public.prayer_times where district <> 'bruneiMuara';

-- Collapse any duplicate (date, prayer) rows before the narrower key exists.
delete from public.prayer_times
where ctid in (
  select ctid
  from (
    select
      ctid,
      row_number() over (
        partition by prayer_date, prayer
        order by updated_at desc, ctid desc
      ) as rn
    from public.prayer_times
  ) ranked
  where ranked.rn > 1
);

alter table public.prayer_times
  drop constraint if exists prayer_times_pkey;

alter table public.prayer_times drop column if exists district;

alter table public.prayer_times
  add constraint prayer_times_pkey primary key (prayer_date, prayer);
