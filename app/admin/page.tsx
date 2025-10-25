'use client'

import { useState, useEffect } from 'react'
import { AdminDashboard } from '@/components/AdminDashboard'
import { AdminLogin } from '@/components/AdminLogin'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check authentication status
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setIsAuthenticated(true)
        setUser(session.user)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (accessToken: string, userData: any) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-8 animate-spin"
          />
          <p className="text-2xl text-black font-bold">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />
}


