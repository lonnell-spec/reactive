-- Phase 1: Attending Merch flag on guests
--
-- Adds a checkbox-driven flag indicating whether the guest plans to
-- attend a merch event / pick up MARKED merch on their visit. Surfaced
-- on the Sunday hospitality digest.

alter table public.guests
  add column if not exists attending_merch boolean not null default false;
