import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { UserPlus, LogIn, Settings } from 'lucide-react'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { FloatingElements } from './FloatingElements'
import { motion } from 'motion/react'
import { supabase } from '../utils/supabase/client'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import churchLogo from 'figma:asset/8a0d7e407ac0e2cb1219f412ca5d6c6eb8ea3b1c.png'

interface AdminLoginProps {
  onLogin: (accessToken: string, user: any) => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.session) {
        onLogin(data.session.access_token, data.session.user)
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-66bf82e5/admin/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ name, email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Account creation failed')
      }

      setMessage('Account created successfully! You can now sign in.')
    } catch (err: any) {
      setError(err.message || 'Account creation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const formData = new FormData(e.target as HTMLFormElement)
    const orgName = formData.get('orgName') as string
    const adminEmail = formData.get('adminEmail') as string

    try {
      // Basic setup - could be expanded later
      setMessage('Setup completed! You can now create an admin account.')
    } catch (err: any) {
      setError('Setup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <FloatingElements />
      <div className="w-full max-w-lg">
        {/* Header */}
        <AnimatedSection className="text-center mb-12">
          <motion.img 
            src={churchLogo} 
            alt="2819 Church Logo" 
            className="h-24 w-auto mx-auto mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <AnimatedText 
            text="2819 CHURCH"
            className="text-5xl font-bold text-black mb-4"
          />
          <AnimatedText 
            text="Administration Portal"
            className="text-2xl text-gray-600"
            delay={0.5}
          />
        </AnimatedSection>

        {/* Messages */}
        {message && (
          <AnimatedSection className="mb-6">
            <Alert className="border-2 border-green-600 bg-green-50">
              <AlertDescription className="text-green-800 text-xl">
                {message}
              </AlertDescription>
            </Alert>
          </AnimatedSection>
        )}

        {error && (
          <AnimatedSection className="mb-6">
            <Alert className="border-2 border-red-600 bg-red-50">
              <AlertDescription className="text-red-800 text-xl">
                {error}
              </AlertDescription>
            </Alert>
          </AnimatedSection>
        )}

        {/* Auth Tabs */}
        <AnimatedSection delay={0.3}>
          <Card className="border-2 border-black shadow-2xl">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-16">
                <TabsTrigger value="signin" className="flex items-center gap-2 text-lg">
                  <LogIn className="h-5 w-5" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5" />
                  Sign Up
                </TabsTrigger>
                <TabsTrigger value="setup" className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Setup
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <CardHeader className="bg-black text-white">
                  <CardTitle className="text-2xl">Sign In</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="signin-email" className="text-xl">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="admin@2819church.com"
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="signin-password" className="text-xl">Password</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        type="submit" 
                        className="w-full bg-red-600 hover:bg-red-700 text-xl py-6"
                        disabled={loading}
                      >
                        {loading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="signup">
                <CardHeader className="bg-black text-white">
                  <CardTitle className="text-2xl">Create Account</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="signup-name" className="text-xl">Full Name</Label>
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="Admin Name"
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="signup-email" className="text-xl">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="admin@2819church.com"
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="signup-password" className="text-xl">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        type="submit" 
                        className="w-full bg-red-600 hover:bg-red-700 text-xl py-6"
                        disabled={loading}
                      >
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </TabsContent>

              <TabsContent value="setup">
                <CardHeader className="bg-black text-white">
                  <CardTitle className="text-2xl">Initial Setup</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSetup} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="setup-org" className="text-xl">Organization Name</Label>
                      <Input
                        id="setup-org"
                        name="orgName"
                        type="text"
                        placeholder="2819 Church"
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="setup-admin" className="text-xl">Admin Email</Label>
                      <Input
                        id="setup-admin"
                        name="adminEmail"
                        type="email"
                        placeholder="admin@2819church.com"
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        type="submit" 
                        className="w-full bg-red-600 hover:bg-red-700 text-xl py-6"
                        disabled={loading}
                      >
                        {loading ? 'Setting up...' : 'Complete Setup'}
                      </Button>
                    </motion.div>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>
        </AnimatedSection>

        {/* Footer */}
        <AnimatedSection delay={0.7} className="text-center mt-12">
          <p className="text-xl text-gray-500">
            2819 Church Guest Registration System
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}