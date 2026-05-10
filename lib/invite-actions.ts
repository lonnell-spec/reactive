'use server'

import { z } from 'zod'
import { getSupabaseServiceClient } from './supabase-client'
import { sendTextMagicSMS } from './textmagic'

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
  // 30-minute TTL on slug-minted tokens — tight window matching the
  // PAM/Lonnell "send and use" workflow. Recipients re-request from the
  // sender if they don't fill it out in time. Admin-generated bound
  // tokens (generateRecipientBoundInvite) keep the longer 72hr TTL.
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

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
 * record, and (for slug-minted tokens) the display_name + auto_approve of
 * the originating slug. Recipient-bound tokens have invite_slug_id = null
 * and return slugDisplayName undefined / autoApprove false.
 */
export async function validateInviteToken(token: string): Promise<{
  valid: boolean
  invite?: {
    id: string
    token: string
    status: string
    expires_at: string
    invite_slug_id: string | null
  }
  slugName?: string
  slugDisplayName?: string
  autoApprove?: boolean
}> {
  const supabase = await getSupabaseServiceClient()

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('invites')
    .select('id, token, status, expires_at, invite_slug_id, invite_slugs(slug, display_name, auto_approve)')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', now)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  // Extract slug short-name (e.g. 'pam'), display_name and auto_approve
  // from the joined invite_slugs relation. Slug name is needed for
  // per-slug UI branching (e.g. PAM-exempt parking notice).
  const slugData = data.invite_slugs && !Array.isArray(data.invite_slugs)
    ? (data.invite_slugs as { slug: string; display_name: string; auto_approve: boolean })
    : Array.isArray(data.invite_slugs) && data.invite_slugs.length > 0
      ? (data.invite_slugs[0] as { slug: string; display_name: string; auto_approve: boolean })
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
    slugName: slugData?.slug,
    slugDisplayName: slugData?.display_name,
    autoApprove: slugData?.auto_approve ?? false,
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

// ===========================================================================
// Phase 1: Recipient-bound invite link generation
// ===========================================================================

const generateRecipientBoundInviteSchema = z.object({
  recipient_name: z.string().min(1, 'Recipient name is required').trim(),
  recipient_phone: z
    .string()
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10, 'Phone must be exactly 10 digits'),
  friend_of_user_id: z.string().uuid('Friend-of must be a valid user'),
  is_reusable: z.boolean().default(false),
  meeting_with_communicator: z.boolean().default(false),
})

export type GenerateRecipientBoundInviteInput = z.input<
  typeof generateRecipientBoundInviteSchema
>

interface GenerateRecipientBoundInviteResult {
  success: boolean
  message?: string
  data?: {
    token: string
    registration_url: string
    sms_sent: boolean
    sms_message?: string
  }
}

// Mirrors getCanonicalUrl in lib/guest-credentials.ts. If a third caller
// appears, lift this into a shared lib/url-utils.ts.
function getAppUrl(): string {
  if (
    process.env.VERCEL_ENV === 'production' &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

/**
 * Mints a one-time, recipient-bound invite token and texts the registration
 * URL to the recipient. Used by the admin link-generation UI at
 * /admin/generate.
 *
 * Recipient-bound tokens differ from slug-minted tokens:
 *   - invite_slug_id is null (admins generate these, not slug visits)
 *   - recipient_name + recipient_phone are bound at mint time and will
 *     be checked against the form submission for mismatch detection
 *   - friend_of_user_id determines pre-approver routing
 *   - created_by_user_id audits which admin generated the link
 *
 * SMS failure does not roll back the invite — the admin can copy the URL
 * from the result and share it manually.
 */
export async function generateRecipientBoundInvite(
  input: GenerateRecipientBoundInviteInput,
  admin: { id: string; email: string },
  dependencies: {
    getSupabaseClient?: typeof getSupabaseServiceClient
    sendSMS?: typeof sendTextMagicSMS
  } = {}
): Promise<GenerateRecipientBoundInviteResult> {
  const {
    getSupabaseClient = getSupabaseServiceClient,
    sendSMS = sendTextMagicSMS,
  } = dependencies

  let validated: z.infer<typeof generateRecipientBoundInviteSchema>
  try {
    validated = generateRecipientBoundInviteSchema.parse(input)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.issues.map(e => e.message).join('; '),
      }
    }
    throw error
  }

  if (!admin?.id) {
    return { success: false, message: 'Admin user is required' }
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
  const registrationUrl = `${getAppUrl()}/register/${token}`

  try {
    const supabase = await getSupabaseClient()
    const { error: insertError } = await supabase.from('invites').insert({
      token,
      invite_slug_id: null,
      status: 'pending',
      expires_at: expiresAt,
      recipient_name: validated.recipient_name,
      recipient_phone: validated.recipient_phone,
      created_by_user_id: admin.id,
      friend_of_user_id: validated.friend_of_user_id,
      is_reusable: validated.is_reusable,
      meeting_with_communicator: validated.meeting_with_communicator,
    })

    if (insertError) {
      console.error('[generateRecipientBoundInvite] Insert failed:', insertError)
      return { success: false, message: 'Failed to create invite' }
    }
  } catch (error) {
    console.error('[generateRecipientBoundInvite] Unexpected error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create invite',
    }
  }

  const smsMessage =
    `Hi ${validated.recipient_name}! ` +
    `You have a personal invite to 2819 Church. ` +
    `Register here: ${registrationUrl} ` +
    `(link expires in 72 hours).`

  const smsResult = await sendSMS({
    phone: validated.recipient_phone,
    message: smsMessage,
  })

  return {
    success: true,
    data: {
      token,
      registration_url: registrationUrl,
      sms_sent: smsResult.success,
      sms_message: smsMessage,
    },
  }
}

/**
 * Returns the list of users who can be selected as "friend of" when
 * generating a recipient-bound invite. Sourced from invite_slugs (the
 * canonical display-name registry), deduped by user_id keeping the most
 * recently created row per user — handles cases like the Nard→Ernest swap
 * where one auth user has multiple slugs.
 */
export async function getFriendOfCandidates(
  dependencies: {
    getSupabaseClient?: typeof getSupabaseServiceClient
  } = {}
): Promise<
  { user_id: string; display_name: string; is_principal: boolean }[]
> {
  const { getSupabaseClient = getSupabaseServiceClient } = dependencies

  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('invite_slugs')
    .select('user_id, display_name, auto_approve, is_active, created_at')
    // Friend of the House is a public pathway slug, not a person — exclude
    // it from the recipient-bound friend-of dropdown where "friend of: a
    // generic public path" would be semantically confusing AND would
    // shadow Lonnell's entry (FotH owns Lonnell's user_id structurally).
    .neq('slug', 'friendofthehouse')
    .order('user_id', { ascending: true })
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('[getFriendOfCandidates] Failed:', error)
    return []
  }

  const seen = new Set<string>()
  const deduped = data.filter(row => {
    if (seen.has(row.user_id)) return false
    seen.add(row.user_id)
    return true
  })

  return deduped
    .map(row => ({
      user_id: row.user_id,
      display_name: row.display_name,
      is_principal: row.auto_approve === true,
    }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
}
