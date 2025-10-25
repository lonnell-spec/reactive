-- Create storage bucket for guest photos
-- Note: Keep bucket private; uploads should be done server-side

insert into storage.buckets (id, name, public)
select 'guest-photos', 'guest-photos', false
where not exists (select 1 from storage.buckets where id = 'guest-photos');

-- Policies
grant usage on schema storage to anon;
create policy "anon can uplad to guest-photos" on storage.objects for insert to anon with check (bucket_id = 'guest-photos');


