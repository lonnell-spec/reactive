-- Phase 0b2: Guests UPDATE policy + PUBLIC revoke on cleanup_old_guests
--
-- 1. Replaces guests_authenticated_update (which was USING (true) for any
--    authenticated user, giving every signed-in user write access to every
--    guest record) with a role-aware policy that requires admin or
--    pre_approver in app_metadata.roles.
--
--    JWT shape verified against real users (Demetria, Lonnell, PAM) on
--    2026-05-06: app_metadata.roles is a JSON array of role strings.
--
-- 2. Revokes EXECUTE on cleanup_old_guests from PUBLIC. Phase 0b revoked
--    from anon and authenticated, but Postgres' implicit default grant
--    to PUBLIC survived. PUBLIC includes every role including anon, so
--    the function remained callable via the public REST endpoint.

-- 1. Replace permissive guests UPDATE policy ----------------------------
drop policy if exists guests_authenticated_update on public.guests;
drop policy if exists guests_admin_update on public.guests;

create policy guests_admin_update on public.guests
  for update to authenticated
  using (
    coalesce(
      (auth.jwt() -> 'app_metadata' -> 'roles')::jsonb ?| array['admin', 'pre_approver'],
      false
    )
  );

-- 2. Close the cleanup_old_guests anon-callable hole properly -----------
revoke execute on function public.cleanup_old_guests() from public;
