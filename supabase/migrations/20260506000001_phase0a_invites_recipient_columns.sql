-- Phase 0a: Recipient-Bound Invite Link Schema
--
-- Adds columns to `invites` to support admin-generated, recipient-bound
-- invite tokens. Replaces the previous "anonymous token per slug visit"
-- model for non-principal users (after Phase 5 sunsets the standard slugs).
--
-- Phase 0b (security hardening) and Phase 0c (status check + auto_approve
-- relocation) are separate migrations.

alter table public.invites
  add column if not exists recipient_name text,
  add column if not exists recipient_phone text,
  add column if not exists created_by_user_id uuid references auth.users(id),
  add column if not exists friend_of_user_id uuid references auth.users(id),
  add column if not exists is_reusable boolean not null default false,
  add column if not exists revoked_at timestamptz,
  add column if not exists meeting_with_communicator boolean not null default false,
  add column if not exists escalated_to_demetria_at timestamptz;

-- Backfill: for historical invites, the "friend of" defaults to the slug
-- owner (the same person who created the invite link). Idempotent — skips
-- rows that already have a value.
update public.invites i
set friend_of_user_id = s.user_id
from public.invite_slugs s
where i.invite_slug_id = s.id
  and i.friend_of_user_id is null;
