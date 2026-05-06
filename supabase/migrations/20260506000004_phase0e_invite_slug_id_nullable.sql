-- Phase 0e: Make invites.invite_slug_id nullable
--
-- Prerequisite for Phase 1 (admin link generation UI). Admin-generated,
-- recipient-bound invite tokens do not originate from a slug visit — they
-- are minted directly by an admin via /admin/generate. The invite_slug_id
-- only applies to the legacy slug-mint flow (now retained only for the
-- PAM and Lonnell principal shortcuts).
--
-- This is a relaxation of an existing constraint. All current rows have
-- a non-null invite_slug_id (verified pre-migration), so no data backfill
-- is needed.

alter table public.invites alter column invite_slug_id drop not null;
