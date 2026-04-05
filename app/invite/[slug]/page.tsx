import { redirect } from 'next/navigation'
import { validateSlug, generateInviteToken } from '@/lib/invite-actions'
import { InvalidInvitePage } from '@/components/InvalidInvitePage'

interface InviteSlugPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Admin permanent invite link page.
 * Validates the slug and, if active, generates a one-time token then
 * immediately redirects the visitor to /register/[token].
 */
export default async function InviteSlugPage({ params }: InviteSlugPageProps) {
  const { slug } = await params

  const result = await validateSlug(slug)

  if (!result.valid || !result.slug_id) {
    return <InvalidInvitePage reason="invalid-slug" />
  }

  const token = await generateInviteToken(result.slug_id)

  redirect(`/register/${token}`)
}
