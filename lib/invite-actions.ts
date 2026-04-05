'use server'

import { getSupabaseServiceClient } from './supabase-client'

/**
 * Validates a slug against the invite_slugs table.
 * Returns whether the slug is active and its associated display_name and id.
 */
export async function validateSlug(slug: string): Promise<{
  valid: boolean
  display_name?: string
  slug_id?: string
}> {
  const supabase = await getSupabaseServiceClient()

  const { data, error } = await supabase
    .from('invite_slugs')
    .select('id, display_name, is_active')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  if (!data.is_active) {
    return { valid: false }
  }

  return {
    valid: true,
    display_name: data.display_name,
    slug_id: data.id,
  }
}

/**
 * Generates a one-time invite token linked to the given slug ID.
 * The token expires 72 hours from creation.
 * Returns the generated token string.
 */
export async function generateInviteToken(slugId: string): Promise<string> {
  const supabase = await getSupabaseServiceClient()

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('invites').insert({
    token,
    invite_slug_id: slugId,
    status: 'pending',
    expires_at: expiresAt,
  })

  if (error) {
    console.error('[generateInviteToken] Failed to create invite:', error)
    throw new Error('Failed to generate invite token')
  }

  return token
}

/**
 * Validates an invite token. Returns whether it is valid, the full invite
 * record, and the display_name of the slug that created it.
 */
export async function validateInviteToken(token: string): Promise<{
  valid: boolean
  invite?: {
    id: string
    token: string
    status: string
    expires_at: string
    invite_slug_id: string
  }
  slugDisplayName?: string
}> {
  const supabase = await getSupabaseServiceClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('invites')
    .select('id, token, status, expires_at, invite_slug_id, invite_slugs(display_name)')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', now)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  // Extract display_name from the joined invite_slugs relation
  const slugDisplayName =
    data.invite_slugs && !Array.isArray(data.invite_slugs)
      ? (data.invite_slugs as { display_name: string }).display_name
      : Array.isArray(data.invite_slugs) && data.invite_slugs.length > 0
        ? (data.invite_slugs[0] as { display_name: string }).display_name
        : undefined

  return {
    valid: true,
    invite: {
      id: data.id,
      token: data.token,
      status: data.status,
      expires_at: data.expires_at,
      invite_slug_id: data.invite_slug_id,
    },
    slugDisplayName,
  }
}

/**
 * Marks an invite token as used, recording the guest ID and timestamp.
 */
export async function burnInviteToken(token: string, guestId: string): Promise<void> {
  const supabase = await getSupabaseServiceClient()

  const { error } = await supabase
    .from('invites')
    .update({
      status: 'used',
      used_at: new Date().toISOString(),
      guest_id: guestId,
    })
    .eq('token', token)

  if (error) {
    console.error('[burnInviteToken] Failed to burn invite token:', error)
    throw new Error('Failed to burn invite token')
  }
}
