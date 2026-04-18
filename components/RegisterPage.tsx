'use client'

import { useEffect, useState } from 'react'
import { validateInviteToken } from '@/lib/invite-actions'
import { GuestForm } from '@/components/GuestForm'
import { InvalidInvitePage } from '@/components/InvalidInvitePage'

interface RegisterPageProps {
  token: string
}

/**
 * Client-side wrapper for the registration page.
 * Validates the token once on mount, then manages all state transitions
 * (loading → form → success) client-side so that server re-renders
 * after the token is burned cannot override the success screen.
 */
export function RegisterPage({ token }: RegisterPageProps) {
  const [state, setState] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [invitedBy, setInvitedBy] = useState<string | undefined>()
  const [autoApprove, setAutoApprove] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function validate() {
      const result = await validateInviteToken(token)
      if (cancelled) return

      if (result.valid) {
        setInvitedBy(result.slugDisplayName)
        setAutoApprove(result.autoApprove ?? false)
        setState('valid')
      } else {
        setState('invalid')
      }
    }

    validate()
    return () => { cancelled = true }
  }, [token])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 text-lg">Validating your invitation...</p>
        </div>
      </div>
    )
  }

  if (state === 'invalid') {
    return <InvalidInvitePage reason="invalid-token" />
  }

  return (
    <main>
      <GuestForm
        inviteToken={token}
        invitedBy={invitedBy}
        autoApprove={autoApprove}
      />
    </main>
  )
}
