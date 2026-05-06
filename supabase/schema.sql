-- Idempotent schema for the PAM Special Guest Registration system.
-- Requirements: Postgres 14+, pgcrypto (for gen_random_uuid)
--
-- This file defines the canonical schema and is safe to re-run against
-- both fresh and existing databases. Ongoing changes are added as new
-- files under supabase/migrations/, not by editing this file in place.

create extension if not exists pgcrypto;

-- Utility: updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;$$;


-- Guests table -------------------------------------------------------------
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
  invite_token text,
  invited_by text,
  attending_merch boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bring existing prod databases into alignment when this script is re-run.
alter table public.guests add column if not exists invite_token text;
alter table public.guests add column if not exists invited_by text;
alter table public.guests add column if not exists attending_merch boolean not null default false;

drop trigger if exists trg_guests_updated_at on public.guests;
create trigger trg_guests_updated_at
before update on public.guests
for each row execute function public.set_updated_at();

-- Children -----------------------------------------------------------------
create table if not exists public.guest_children (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  name text not null,
  dob date,
  allergies text,
  photo_path text
);

create index if not exists idx_guest_children_guest_id on public.guest_children(guest_id);

-- Guest Archive (historical records, populated by cleanup_old_guests) ------
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

-- Invite Slugs: permanent admin shortcuts (e.g. /invite/lonnell) ----------
-- Post-Phase-5 sunset: only `pam` and `lonnell` remain active. All other
-- slugs are admin-generated per-recipient via the admin UI.
create table if not exists public.invite_slugs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  slug text not null unique,
  display_name text not null,
  auto_approve boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invites: one-time tokens. Phase 0a added recipient binding fields. ------
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  invite_slug_id uuid not null references public.invite_slugs(id),
  guest_id uuid references public.guests(id),
  status text not null default 'pending'
    check (status = any (array['pending'::text, 'used'::text, 'expired'::text])),
  ip_address text,
  user_agent text,
  created_at timestamptz default now(),
  used_at timestamptz,
  expires_at timestamptz default (now() + interval '72 hours'),
  -- Phase 0a: recipient-bound link fields
  recipient_name text,
  recipient_phone text,
  created_by_user_id uuid references auth.users(id),
  friend_of_user_id uuid references auth.users(id),
  is_reusable boolean not null default false,
  revoked_at timestamptz,
  meeting_with_communicator boolean not null default false,
  escalated_to_demetria_at timestamptz
);

-- Bring existing prod databases into alignment when this script is re-run.
alter table public.invites add column if not exists recipient_name text;
alter table public.invites add column if not exists recipient_phone text;
alter table public.invites add column if not exists created_by_user_id uuid references auth.users(id);
alter table public.invites add column if not exists friend_of_user_id uuid references auth.users(id);
alter table public.invites add column if not exists is_reusable boolean not null default false;
alter table public.invites add column if not exists revoked_at timestamptz;
alter table public.invites add column if not exists meeting_with_communicator boolean not null default false;
alter table public.invites add column if not exists escalated_to_demetria_at timestamptz;
