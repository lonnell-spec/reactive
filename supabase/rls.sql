-- usage to schema
grant usage on schema public to anon;

-- grant privileges
grant insert on table public.guests to anon;
grant select (id) on table public.guests to anon;
grant insert on table public.guest_children to anon;
grant update (photo_path) on table public.guests to anon;
grant update (photo_path) on table public.guest_children to anon;
grant select (id) on table public.guest_children to anon;


-- Enable RLS and define policies
alter table public.guests enable row level security;
alter table public.guest_children enable row level security;

-- RLS policies
drop policy if exists guests_anon_insert on public.guests;
create policy guests_anon_insert on public.guests
  for insert to anon
  with check (true);

drop policy if exists guests_update_photo_path on public.guests;
create policy guests_update_photo_path on public.guests
  for update to anon
  using (true);

drop policy if exists guests_select_id on public.guests;
create policy guests_select_id on public.guests
  for select to anon
  using (true);

drop policy if exists guest_children_anon_insert on public.guest_children;
create policy guest_children_anon_insert on public.guest_children
  for insert to anon
  with check (true);

drop policy if exists guest_children_update_photo_url on public.guest_children;
create policy guest_children_update_photo_url on public.guest_children
  for update to anon
  using (true);

drop policy if exists guest_children_select_id on public.guest_children;
create policy guest_children_select_id on public.guest_children
  for select to anon
  using (true);
