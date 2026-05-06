'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AdminMenu } from '@/components/AdminMenu'
import { GenerateLinkForm } from '@/components/GenerateLinkForm'

export default function GenerateLinkPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientComponentClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin?redirect=' + encodeURIComponent('/admin/generate'))
        return
      }
      setUser(session.user)
      setLoading(false)
    }
    checkAuth()
  }, [router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <AdminMenu currentPath="/admin/generate" />

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-black mb-2">Generate Invite Link</h2>
          <p className="text-gray-600">
            Create a one-time, recipient-bound invite link for a guest. The link
            will be texted to the recipient and dies after one use.
          </p>
        </div>

        <GenerateLinkForm user={{ id: user.id, email: user.email }} />
      </div>
    </div>
  )
}
