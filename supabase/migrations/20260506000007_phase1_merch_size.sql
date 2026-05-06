-- Phase 1: Add merch_size to guests
--
-- Free-text size field shown to guests on the registration form when
-- they check "Do you want to visit our merch shop?" (attending_merch).
-- Free-text by design — guests can type "M", "Medium", "XL men's",
-- "size 10", etc. without being forced into a dropdown that may not
-- cover all merch types.

alter table public.guests
  add column if not exists merch_size text;
