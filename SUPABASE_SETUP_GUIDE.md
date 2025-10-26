# Supabase Setup Guide for Pre-Approval Workflow

This guide explains how to set up Supabase for the pre-approval workflow in the Reactive Church Guest Registration system.

## Table of Contents

1. [Database Schema Setup](#database-schema-setup)
2. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
3. [Storage Setup](#storage-setup)
4. [User Roles Setup](#user-roles-setup)
5. [Testing the Workflow](#testing-the-workflow)

## SQL Files

This guide references the following SQL files in the `supabase` directory:

- `schema.sql` - Creates the database tables
- `rls.sql` - Sets up Row Level Security policies
- `storage.sql` - Creates the storage bucket and policies
- `users_roles.sql` - Contains SQL for setting up user roles

## Environment Variables

In addition to the database setup, the application requires several environment variables to be set in the `.env.local` file. These include:

### Registration Codes

The application uses role-specific registration codes to control who can register for each role:

```
# Registration codes for different roles
PRE_APPROVER_REGISTRATION_CODE=preapprovercode
APPROVER_REGISTRATION_CODE=approvercode
ADMIN_REGISTRATION_CODE=admincode
```

These codes are validated server-side when a user attempts to register for a specific role. Make sure to change these default values to secure, unique codes in your production environment.

## Database Schema Setup

The guest registration system uses two main tables: `guests` and `guest_children`. The schema includes fields for tracking pre-approval status.

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL to create the schema:

```sql
-- Idempotent schema for guest registration
-- Requirements: Postgres 14+, pgcrypto (for gen_random_uuid)

create extension if not exists pgcrypto;

-- Utility: updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;

-- Guests table
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending_pre_approval',
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  visit_date date,
  gathering_time text,
  total_guests int,
  should_enroll_children boolean not null default false,
  vehicle_type text,
  vehicle_make text,
  vehicle_model text,
  vehicle_color text,
  food_allergies text,
  special_needs text,
  additional_notes text,
  photo_path text,
  qr_code text,
  code_word text,
  qr_expiry timestamptz,
  pre_approved_by uuid,
  pre_approved_at timestamptz,
  pre_approval_denied_by uuid,
  pre_approval_denied_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  denied_by uuid,
  denied_at timestamptz,
  last_modified_admin_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guests_unique_daily
on public.guests(lower(email), visit_date);

drop trigger if exists trg_guests_updated_at on public.guests;
create trigger trg_guests_updated_at
before update on public.guests
for each row execute function public.set_updated_at();

-- Children
create table if not exists public.guest_children (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  name text not null,
  dob date,
  allergies text,
  photo_path text
);

create index if not exists idx_guest_children_guest_id on public.guest_children(guest_id);
```

## Row Level Security (RLS) Policies

The system uses Row Level Security (RLS) policies to control access to guest data based on user roles.

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL to set up RLS policies:

```sql
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


-- Enable RLS and define policies
alter table public.guests enable row level security;
alter table public.guest_children enable row level security;

-- RLS policies for anon user
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
    (auth.jwt() ->> 'role' = 'pre_approver' AND status = 'pending_pre_approval') OR
    -- Pending approvers can see PENDING submissions
    (auth.jwt() ->> 'role' = 'pending_approver' AND status = 'pending') OR
    -- Admins can see all submissions
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Users with multiple roles can see relevant submissions
    (auth.jwt() ->> 'role' like '%pre_approver%' AND status = 'pending_pre_approval') OR
    (auth.jwt() ->> 'role' like '%pending_approver%' AND status = 'pending') OR
    -- If showing completed submissions, allow access to approved and denied
    (status IN ('approved', 'denied', 'pre_approval_denied'))
  );

drop policy if exists guests_pre_approver_update on public.guests;
create policy guests_pre_approver_update on public.guests
  for update to authenticated
  using (
    -- Pre-approvers can update PENDING_PRE_APPROVAL submissions
    (auth.jwt() ->> 'role' = 'pre_approver' AND status = 'pending_pre_approval') OR
    -- Pending approvers can update PENDING submissions
    (auth.jwt() ->> 'role' = 'pending_approver' AND status = 'pending') OR
    -- Admins can update all submissions
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Users with multiple roles can update relevant submissions
    (auth.jwt() ->> 'role' like '%pre_approver%' AND status = 'pending_pre_approval') OR
    (auth.jwt() ->> 'role' like '%pending_approver%' AND status = 'pending')
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
        (auth.jwt() ->> 'role' = 'pre_approver' AND guests.status = 'pending_pre_approval') OR
        -- Pending approvers can see children of PENDING submissions
        (auth.jwt() ->> 'role' = 'pending_approver' AND guests.status = 'pending') OR
        -- Admins can see all children
        (auth.jwt() ->> 'role' = 'admin') OR
        -- Users with multiple roles can see relevant children
        (auth.jwt() ->> 'role' like '%pre_approver%' AND guests.status = 'pending_pre_approval') OR
        (auth.jwt() ->> 'role' like '%pending_approver%' AND guests.status = 'pending') OR
        -- If showing completed submissions, allow access to children of approved and denied guests
        (guests.status IN ('approved', 'denied', 'pre_approval_denied'))
      )
    )
  );
```

## Storage Setup

The system uses Supabase Storage for guest photos and child photos.

1. Go to your Supabase project dashboard
2. Navigate to the Storage section
3. Create a new bucket named `guest-photos`
4. Set the bucket to private
5. Run the following SQL to set up storage permissions:

```sql
-- Create storage bucket if it doesn't exist
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

-- Allow authenticated users to insert into the bucket
create policy "Authenticated users can upload to guest-photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'guest-photos');

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
```

## User Roles Setup

The system uses three main user roles:

1. **pre_approver**: Can view and pre-approve/deny new guest registrations
2. **pending_approver**: Can view and approve/deny pre-approved guests
3. **admin**: Has full access to all guest registrations

### Creating Users with Specific Roles

#### Method 1: Using the Admin Dashboard

1. Use the Admin Dashboard's registration form at `/admin`
2. Select the appropriate role (Pre-Approver, Approver, or Admin)
3. Enter the corresponding registration code for that role (from your `.env.local` file)
4. Complete the registration form with email and password

> **Note**: Each role requires a specific registration code. These codes are defined in your `.env.local` file as `PRE_APPROVER_REGISTRATION_CODE`, `APPROVER_REGISTRATION_CODE`, and `ADMIN_REGISTRATION_CODE`.

#### Method 2: Using SQL (for existing users)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands in `users_roles.sql` or use the following SQL to update a user's role:

```sql
-- For a pre-approver
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "pre_approver"}'
where email = 'preapprover@example.com';

-- For a pending approver
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "pending_approver"}'
where email = 'approver@example.com';

-- For a user with both roles
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "pre_approver,pending_approver"}'
where email = 'both@example.com';

-- For an admin
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
where email = 'admin@example.com';
```

### Verifying User Roles

To verify that a user has the correct role:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Find the user and check their "app_metadata" column
4. It should contain: `{"role": "pre_approver"}` or `{"role": "pending_approver"}` or `{"role": "admin"}` or a combination like `{"role": "pre_approver,pending_approver"}`

## Testing the Workflow

Follow these steps to test the complete pre-approval workflow:

### 1. Set up Users in Supabase

Create three users with different roles:
- `preapprover@example.com` with role `pre_approver`
- `approver@example.com` with role `pending_approver`
- `admin@example.com` with role `admin`

### 2. Submit a Guest Form

1. Go to the main guest registration form at `/`
2. Fill out the form with test data
3. Submit the form
4. The guest status will be set to `pending_pre_approval`

### 3. Log in as Pre-Approver

1. Go to `/admin`
2. Log in with the pre-approver credentials
3. You should see the "Pending Pre-Approval Guests" section
4. You should NOT see the "Pending Guests" section
5. Click on a guest to view details
6. Click "Pre-Approve" or "Deny Pre-Approval"
7. If approved, the guest status will change to `pending`

### 4. Log in as Pending Approver

1. Log out of the pre-approver account
2. Log in with the pending approver credentials
3. You should see the "Pending Guests" section
4. You should NOT see the "Pending Pre-Approval Guests" section
5. Click on a guest to view details
6. Click "Approve Guest" or "Deny Guest"
7. If approved, the guest status will change to `approved` and a QR code will be generated

### 5. Log in as Admin

1. Log out of the pending approver account
2. Log in with the admin credentials
3. You should see both "Pending Pre-Approval Guests" and "Pending Guests" sections
4. You should be able to perform all actions from both roles

## Troubleshooting

### User Role Issues

If a user can't see the expected guests:

1. Check the user's role in Supabase Authentication > Users
2. Verify that the RLS policies are correctly set up
3. Check the browser console for any errors
4. Try clearing the browser cache and logging in again

### Database Issues

If guests are not being properly stored or updated:

1. Check the Supabase logs for any errors
2. Verify that the schema is correctly set up
3. Check that the RLS policies are allowing the necessary operations

### Storage Issues

If photos are not being uploaded or displayed:

1. Check that the storage bucket is correctly set up
2. Verify that the storage policies are allowing the necessary operations
3. Check the browser console for any errors related to file uploads

## Conclusion

This setup guide covers the essential configuration for the pre-approval workflow in the Reactive Church Guest Registration system. If you encounter any issues not covered in the troubleshooting section, please contact the system administrator.
