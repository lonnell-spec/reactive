-- Phase 0b: Security Hardening — Safe Subset
--
-- Closes the highest-priority security gaps surfaced by the Supabase
-- advisor that do not depend on assumptions about the runtime JWT shape:
--
--   1. invite_slugs / invites have RLS disabled despite having policies
--      (advisor: rls_disabled_in_public, policy_exists_rls_disabled)
--   2. invites.token is exposed via API to the anon role
--      (advisor: sensitive_columns_exposed)
--   3. cleanup_old_guests() is callable by anon via /rest/v1/rpc
--      (advisor: anon_security_definer_function_executable)
--   4. set_updated_at / cleanup_old_guests have mutable search_path
--      (advisor: function_search_path_mutable)
--
-- The guests_authenticated_update policy tightening is deferred to a
-- separate migration (Phase 0b2) until we verify the JWT app_metadata.roles
-- shape against a real admin user.
--
-- This migration is safe because the runtime client at
-- lib/supabase-client.ts uses SUPABASE_SERVICE_ROLE_KEY and provably
-- bypasses RLS today (guests + guest_children both have RLS enabled and
-- the form successfully writes to them in prod).

-- ===========================================================================
-- 1. Replace permissive policies on invite_slugs / invites
-- ===========================================================================

-- invite_slugs --------------------------------------------------------------
drop policy if exists manage_slugs on public.invite_slugs;
drop policy if exists read_active_slugs on public.invite_slugs;
drop policy if exists invite_slugs_service_all on public.invite_slugs;
drop policy if exists invite_slugs_read_active on public.invite_slugs;

create policy invite_slugs_service_all on public.invite_slugs
  for all to service_role using (true) with check (true);

-- anon and authenticated may read only ACTIVE slugs (needed for the public
-- /invite/[slug] route to validate the slug exists and is active).
create policy invite_slugs_read_active on public.invite_slugs
  for select to anon, authenticated using (is_active = true);

-- invites -------------------------------------------------------------------
drop policy if exists insert_invites on public.invites;
drop policy if exists manage_invites on public.invites;
drop policy if exists read_invites on public.invites;
drop policy if exists update_invites on public.invites;
drop policy if exists invites_service_all on public.invites;

create policy invites_service_all on public.invites
  for all to service_role using (true) with check (true);

-- NOTE: anon and authenticated have NO direct policy on `invites`. All
-- token operations must go through server actions in lib/invite-actions.ts
-- which use getSupabaseServiceClient() and bypass RLS. This closes the
-- invites.token enumeration vector.

-- ===========================================================================
-- 2. Enable RLS on the previously-open tables
-- ===========================================================================

alter table public.invite_slugs enable row level security;
alter table public.invites enable row level security;

-- ===========================================================================
-- 3. Revoke anon / authenticated EXECUTE on cleanup_old_guests
-- ===========================================================================

revoke execute on function public.cleanup_old_guests() from anon;
revoke execute on function public.cleanup_old_guests() from authenticated;

-- pg_cron continues to run as the postgres role internally; only the
-- public REST endpoint at /rest/v1/rpc/cleanup_old_guests is closed off.

-- ===========================================================================
-- 4. Pin search_path on public functions (advisor warning fix)
-- ===========================================================================

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.cleanup_old_guests() set search_path = public, pg_temp;
