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
  external_guest_id uuid unique default gen_random_uuid(),
  text_callback_reference_id serial unique,
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
  pass_id uuid unique,
  qr_code text,
  code_word text unique,
  expires_at timestamptz,
  is_used boolean not null default false,
  used_at timestamptz,
  pre_approved_by text,
  pre_approved_at timestamptz,
  pre_approval_denied_by text,
  pre_approval_denied_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  denied_by text,
  denied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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


-- Security definer function to pre-approve a guest. Has to be done this way to avoid RLS conflicts.
create or replace function public.pre_approve_guest(
  guest_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_pre_approver boolean;
  admin_email text;
begin
  -- First, confirm the user has the 'pre_approver' role
  select (auth.jwt() -> 'app_metadata' ->> 'role') = 'pre_approver' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  into is_pre_approver;
  
  -- Get the current user's email
  select auth.jwt() ->> 'email' into admin_email;

  if is_pre_approver then
    -- Now, perform the privileged update.
    -- The update bypasses RLS because this function is a security definer.
    update public.guests
    set 
      status = 'pending',
      pre_approved_by = admin_email,
      pre_approved_at = now()
    where id = guest_id and status = 'pending_pre_approval';
  else
    raise exception 'You do not have permission to pre-approve guests.';
  end if;
end;
$$;

grant execute on function public.pre_approve_guest(uuid) to authenticated;

-- Security definer function to deny pre-approval for a guest
create or replace function public.deny_pre_approve_guest(
  guest_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_pre_approver boolean;
  admin_email text;
begin
  -- First, confirm the user has the 'pre_approver' role
  select (auth.jwt() -> 'app_metadata' ->> 'role') = 'pre_approver' or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  into is_pre_approver;
  
  -- Get the current user's email
  select auth.jwt() ->> 'email' into admin_email;

  if is_pre_approver then
    -- Now, perform the privileged update.
    -- The update bypasses RLS because this function is a security definer.
    update public.guests
    set 
      status = 'pre_approval_denied',
      pre_approval_denied_by = admin_email,
      pre_approval_denied_at = now()
    where id = guest_id and status = 'pending_pre_approval';
  else
    raise exception 'You do not have permission to deny pre-approval for guests.';
  end if;
end;
$$;

grant execute on function public.deny_pre_approve_guest(uuid) to authenticated;