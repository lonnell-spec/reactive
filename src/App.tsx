import React, { useState, useEffect } from 'react'
import { GuestForm } from './components/GuestForm'
import { AdminDashboard } from './components/AdminDashboard'
import { StatusCheck } from './components/StatusCheck'
import { AdminLogin } from './components/AdminLogin'
import { FloatingElements } from './components/FloatingElements'
import { motion } from 'motion/react'
import { supabase } from './utils/supabase/client'
import { projectId, publicAnonKey } from './utils/supabase/info'

export default function App() {
  const [currentView, setCurrentView] = useState<'guest' | 'admin' | 'status'>('guest')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Check URL for admin mode and status mode
    const urlParams = new URLSearchParams(window.location.search)
    const isAdminMode = window.location.pathname === '/admin' || urlParams.get('admin') === 'true'
    const isStatusMode = window.location.pathname.includes('/status')
    
    if (isAdminMode) {
      setCurrentView('admin')
    } else if (isStatusMode) {
      setCurrentView('status')
    } else {
      setCurrentView('guest')
    }

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
      setCurrentView('guest')
      window.history.pushState({}, '', '/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <FloatingElements />
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-2xl text-black font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Loading...
          </motion.p>
        </div>
      </div>
    )
  }

  // Admin view
  if (currentView === 'admin') {
    if (!isAuthenticated) {
      return <AdminLogin onLogin={handleLogin} />
    }
    return <AdminDashboard user={user} onLogout={handleLogout} />
  }

  // Status check view
  if (currentView === 'status') {
    return <StatusCheck />
  }

  // Guest registration view (default)
  return <GuestForm />
}