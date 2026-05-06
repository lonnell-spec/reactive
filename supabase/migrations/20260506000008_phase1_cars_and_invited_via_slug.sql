-- Phase 1: Number of cars + denormalized invited_via_slug
--
-- Adds `number_of_cars` so guests can indicate how many vehicles they
-- are bringing. Triggers a different parking SMS message and an in-page
-- notice when > 2 (parking moves from X Lot to the cones lot beyond
-- the main gate). The rule is conditioned on which slug minted the
-- guest's invite token — PAM-minted tokens always park in X Lot
-- regardless of car count.
--
-- `invited_via_slug` denormalizes the slug short name (e.g. 'pam',
-- 'lonnell', 'friendofthehouse') onto the guest record at submit time
-- so SMS routing can branch without an extra join through the invites
-- table. Null for admin-generated recipient-bound tokens (no slug).

alter table public.guests
  add column if not exists number_of_cars integer not null default 1,
  add column if not exists invited_via_slug text;

-- Sanity bound to keep accidental free-text from breaking digest formatting.
alter table public.guests drop constraint if exists guests_number_of_cars_check;
alter table public.guests add constraint guests_number_of_cars_check
  check (number_of_cars >= 1 and number_of_cars <= 20);
