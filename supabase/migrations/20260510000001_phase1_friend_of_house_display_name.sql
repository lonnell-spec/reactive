-- Phase 1 polish: Friend of the House display_name article
--
-- Updates the slug's display_name from "Friend of the House" to
-- "a Friend of the House" so the registration form banner reads
-- "Invited by a Friend of the House" (grammatically correct article).
--
-- This denormalized value also propagates to guests.invited_by on new
-- submissions; existing guests retain whatever was current at their
-- submission time.

update public.invite_slugs
   set display_name = 'a Friend of the House',
       updated_at = now()
 where slug = 'friendofthehouse';
