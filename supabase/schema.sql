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


