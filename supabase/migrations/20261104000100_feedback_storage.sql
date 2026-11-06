-- specs/feedback/spec.md — public bucket holding feedback screenshots.
-- The browser never writes here; `POST /api/feedback/upload` does, with the
-- service role, after checking the type and size. Public read keeps the image
-- visible in the filed GitHub issue.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback',
  'feedback',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may read an attachment; only the service role writes or deletes.
drop policy if exists "feedback attachments public read" on storage.objects;
create policy "feedback attachments public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'feedback');

drop policy if exists "feedback attachments service write" on storage.objects;
create policy "feedback attachments service write"
  on storage.objects for insert
  to service_role
  with check (bucket_id = 'feedback');

drop policy if exists "feedback attachments service delete" on storage.objects;
create policy "feedback attachments service delete"
  on storage.objects for delete
  to service_role
  using (bucket_id = 'feedback');
