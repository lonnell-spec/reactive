import { RegisterPage } from '@/components/RegisterPage'

interface RegisterTokenPageProps {
  params: Promise<{ token: string }>
}

/**
 * Guest registration page reached after the invite redirect.
 * Passes the token to the client-side RegisterPage component,
 * which validates once on mount and manages all state transitions
 * client-side to prevent server re-renders from overriding the
 * success screen after token burn.
 */
export default async function RegisterTokenPage({ params }: RegisterTokenPageProps) {
  const { token } = await params

  return <RegisterPage token={token} />
}
