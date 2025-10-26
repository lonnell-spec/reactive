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
grant update (status, pre_approved_by, pre_approved_at, pre_approval_denied_by, pre_approval_denied_at, 
              approved_by, approved_at, denied_by, denied_at, qr_code, code_word, qr_expiry) 
       on table public.guests to authenticated;
grant select on table public.guest_children to authenticated;

-- grant privileges for service role (system operations)
grant select on table public.guests to service_role;
grant delete on table public.guests to service_role;
grant delete on table public.guest_children to service_role;

-- for testing using service role - can remove later
grant insert on table public.guests to service_role;
grant select (id) on table public.guests to service_role;
grant insert on table public.guest_children to service_role;
grant update (photo_path) on table public.guests to service_role;
grant update (photo_path) on table public.guest_children to service_role;
grant select (id) on table public.guest_children to service_role;


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
  
-- RLS policies for authenticated users
drop policy if exists guests_pre_approver_select on public.guests;
create policy guests_pre_approver_select on public.guests
  for select to authenticated
  using (
    -- Pre-approvers can see PENDING_PRE_APPROVAL submissions
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'pre_approver' AND status = 'pending_pre_approval') OR
    -- Pending approvers can see PENDING submissions
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'pending_approver' AND status = 'pending') OR
    -- Admins can see all submissions
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') OR
    -- Users with multiple roles can see relevant submissions
    ((auth.jwt() -> 'app_metadata' ->> 'role') like '%pre_approver%' AND status = 'pending_pre_approval') OR
    ((auth.jwt() -> 'app_metadata' ->> 'role') like '%pending_approver%' AND status = 'pending') OR
    -- If showing completed submissions, allow access to approved and denied
    (status IN ('approved', 'denied', 'pre_approval_denied'))
  );

drop policy if exists guests_pre_approver_update on public.guests;
create policy guests_pre_approver_update on public.guests
  for update to authenticated
  using (
    -- Pre-approvers can update PENDING_PRE_APPROVAL submissions
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'pre_approver' AND status = 'pending_pre_approval') OR
    -- Pending approvers can update PENDING submissions
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'pending_approver' AND status = 'pending') OR
    -- Admins can update all submissions
    ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') OR
    -- Users with multiple roles can update relevant submissions
    ((auth.jwt() -> 'app_metadata' ->> 'role') like '%pre_approver%' AND status = 'pending_pre_approval') OR
    ((auth.jwt() -> 'app_metadata' ->> 'role') like '%pending_approver%' AND status = 'pending')
  );

drop policy if exists guest_children_authenticated_select on public.guest_children;
create policy guest_children_authenticated_select on public.guest_children
  for select to authenticated
  using (
    -- Check if the user has access to the parent guest record
    exists (
      select 1 from public.guests
      where guests.id = guest_children.guest_id
      and (
        -- Pre-approvers can see children of PENDING_PRE_APPROVAL submissions
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'pre_approver' AND guests.status = 'pending_pre_approval') OR
        -- Pending approvers can see children of PENDING submissions
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'pending_approver' AND guests.status = 'pending') OR
        -- Admins can see all children
        ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') OR
        -- Users with multiple roles can see relevant children
        ((auth.jwt() -> 'app_metadata' ->> 'role') like '%pre_approver%' AND guests.status = 'pending_pre_approval') OR
        ((auth.jwt() -> 'app_metadata' ->> 'role') like '%pending_approver%' AND guests.status = 'pending') OR
        -- If showing completed submissions, allow access to children of approved and denied guests
        (guests.status IN ('approved', 'denied', 'pre_approval_denied'))
      )
    )
  );
