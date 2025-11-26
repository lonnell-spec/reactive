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
  text_callback_reference_id INTEGER unique,
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

-- Guest Archive table for historical records
create table if not exists public.guest_archive (
  id uuid primary key default gen_random_uuid(),
  original_guest_id uuid not null,
  first_name text not null,
  last_name_initial text not null,
  final_status text not null,
  visit_date date not null,
  gathering_time text not null,
  did_visit boolean not null default false,
  archived_at timestamptz not null default now()
);

create index if not exists idx_guest_archive_visit_date on public.guest_archive(visit_date);
create index if not exists idx_guest_archive_archived_at on public.guest_archive(archived_at);