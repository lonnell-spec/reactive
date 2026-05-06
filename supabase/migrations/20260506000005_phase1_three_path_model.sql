-- Phase 1: Three-Path Slug Model
--
-- Three permanent slugs are now the primary entry points for guest invites:
--   - /invite/pam              auto-approve (existing)
--   - /invite/lonnell          auto-approve (existing)
--   - /invite/friendofthehouse pre-approver review (NEW)
--
-- The 6 prior standard slugs (ashley, demetria, don, ernest, jatona,
-- jermain) are sunset by flipping is_active=false. Their /invite/[slug]
-- URLs will now show "InvalidInvitePage" via the existing validateSlug
-- check. Their rows stay in the table (not dropped) so historical guest
-- references remain valid and the slugs are easy to re-activate later.
--
-- Friend of the House owns user_id = Lonnell. The FK only matters
-- structurally; the dropdown helper getFriendOfCandidates filters this
-- slug out so it does not shadow Lonnell's entry.

-- Insert Friend of the House -----------------------------------------------
insert into public.invite_slugs (slug, display_name, user_id, auto_approve, is_active)
values (
  'friendofthehouse',
  'Friend of the House',
  '580f4fb6-a258-4de8-8203-b4f60784b865',  -- Lonnell Williams
  false,
  true
)
on conflict (slug) do nothing;

-- Sunset the 6 standard slugs ----------------------------------------------
update public.invite_slugs
   set is_active = false,
       updated_at = now()
 where slug in ('ashley', 'demetria', 'don', 'ernest', 'jatona', 'jermain')
   and is_active = true;
