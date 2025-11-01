-- Create storage bucket for guest photos
-- Note: Keep bucket private for security; use signed URLs for access

insert into storage.buckets (id, name, public)
values ('guest-photos', 'guest-photos', false)
on conflict (id) do nothing;

-- Policies
grant usage on schema storage to anon;
grant usage on schema storage to authenticated;
grant usage on schema storage to service_role;

-- Allow authenticated users to read from the bucket
create policy "Authenticated users can read from guest-photos"
on storage.objects for select
to authenticated
using (bucket_id = 'guest-photos');

-- Allow anon users to upload to guest-photos (for guest registration)
create policy "Anon users can upload to guest-photos"
on storage.objects for insert
to anon
with check (bucket_id = 'guest-photos');

-- Allow service role to delete from guest-photos (for rollbacks)
create policy "Service role can delete from guest-photos"
on storage.objects for delete
to service_role
using (bucket_id = 'guest-photos');
