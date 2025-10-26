-- usage to schema
grant usage on schema public to anon;
grant usage on schema public to service_role;
grant usage on schema public to authenticated;

-- grant privileges for anon user (guest registration)
grant insert on table public.guests to anon;
grant select (id) on table public.guests to anon;
grant insert on table public.guest_children to anon;
grant update (photo_path) on table public.guests to anon;
grant update (photo_path) on table public.guest_children to anon;
grant select (id) on table public.guest_children to anon;

-- grant privileges for authenticated users (admin dashboard)
grant select on table public.guests to authenticated;
grant select on table public.guest_children to authenticated;

-- grant privileges for service role (system operations)
grant select on table public.guests to service_role;
grant delete on table public.guests to service_role;
grant delete on table public.guest_children to service_role;

-- Enable RLS and define policies
alter table public.guests enable row level security;
alter table public.guest_children enable row level security;

-- RLS policies
drop policy if exists guests_anon_insert on public.guests;
create policy guests_anon_insert on public.guests
  for insert to anon
  with check (true);

drop policy if exists guests_anon_update on public.guests;
create policy guests_anon_update on public.guests
  for update to anon
  using (true);

drop policy if exists guests_anon_select on public.guests;
create policy guests_anon_select on public.guests
  for select to anon
  using (true);

drop policy if exists guest_children_anon_insert on public.guest_children;
create policy guest_children_anon_insert on public.guest_children
  for insert to anon
  with check (true);

drop policy if exists guest_children_anon_update on public.guest_children;
create policy guest_children_anon_update on public.guest_children
  for update to anon
  using (true);

drop policy if exists guest_children_anon_select on public.guest_children;
create policy guest_children_anon_select on public.guest_children
  for select to anon
  using (true);
  
-- RLS policies for authenticated users
drop policy if exists guests_role_select on public.guests;
create policy guests_role_select on public.guests
  for select to authenticated
  using (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'pre_approver' AND status = 'pending_pre_approval') OR
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

drop policy if exists guests_admin_update on public.guests;
create policy guests_admin_update on public.guests
  for update to authenticated
  using (
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );



drop policy if exists guest_children_role_select on public.guest_children;
create policy guest_children_role_select on public.guest_children
  for select to authenticated
  using (
    -- Check if the user has access to the parent guest record
    exists (
      select 1 from public.guests
      where guests.id = guest_children.guest_id
      and (
            ((auth.jwt() -> 'app_metadata' ->> 'role') = 'pre_approver' AND guests.status = 'pending_pre_approval') OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
      )
    )
  );
