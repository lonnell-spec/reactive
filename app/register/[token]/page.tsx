import { validateInviteToken } from '@/lib/invite-actions'
import { GuestForm } from '@/components/GuestForm'
import { InvalidInvitePage } from '@/components/InvalidInvitePage'

interface RegisterTokenPageProps {
  params: Promise<{ token: string }>
}

/**
 * Guest registration page reached after the invite redirect.
 * Validates the one-time token and renders either the guest registration
 * form (with the token embedded) or an invalid-invite page.
 */
export default async function RegisterTokenPage({ params }: RegisterTokenPageProps) {
  const { token } = await params

  const result = await validateInviteToken(token)

  if (!result.valid) {
    return <InvalidInvitePage reason="invalid-token" />
  }

  return (
    <main>
      <GuestForm
        inviteToken={token}
        invitedBy={result.slugDisplayName}
      />
    </main>
  )
}
