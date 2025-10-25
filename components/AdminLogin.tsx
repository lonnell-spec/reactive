'use client'

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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

interface AdminLoginProps {
  onLogin: (accessToken: string, user: any) => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('sign-in')
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminCode, setAdminCode] = useState('')

  const supabase = createClientComponentClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      if (!email || !password) {
        throw new Error('Email and password are required')
      }
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) throw signInError
      
      if (data?.session) {
        onLogin(data.session.access_token, data.user)
      } else {
        throw new Error('Authentication failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      // Validate form
      if (!email || !password || !confirmPassword || !adminCode) {
        throw new Error('All fields are required')
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match')
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      
      // Verify admin code (in production this would be more secure)
      if (adminCode !== 'CHURCH-ADMIN-2819') {
        throw new Error('Invalid admin code')
      }

      // Create user account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'admin'
          }
        }
      })
      
      if (signUpError) throw signUpError
      
      setMessage('Account created successfully! Please sign in.')
      setActiveTab('sign-in')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    
    try {
      if (!email) {
        throw new Error('Email is required')
      }
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/admin?reset=true',
      })
      
      if (resetError) throw resetError
      
      setMessage('Password reset instructions have been sent to your email.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset request failed')
      console.error('Password reset error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <FloatingElements />
      <div className="max-w-md mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-12">
          <motion.div
            className="relative h-24 w-24 mx-auto mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image 
              src="/church-logo.png" 
              alt="2819 Church Logo"
              width={96}
              height={96}
              className="h-24 w-auto mx-auto"
            />
          </motion.div>
          <AnimatedText 
            text="2819 CHURCH"
            className="text-5xl font-bold text-black mb-2"
          />
          <AnimatedText 
            text="Admin Dashboard"
            className="text-2xl text-gray-600"
            delay={0.3}
          />
        </AnimatedSection>

        {/* Error/Message Alert */}
        {(error || message) && (
          <AnimatedSection className="mb-8">
            <Alert className={`border-2 ${error ? 'border-red-600 bg-red-50' : 'border-green-600 bg-green-50'}`}>
              <AlertDescription className={`${error ? 'text-red-800' : 'text-green-800'} text-xl`}>
                {error || message}
              </AlertDescription>
            </Alert>
          </AnimatedSection>
        )}
        
        {/* Login/Register Form */}
        <AnimatedSection delay={0.2}>
          <Card className="border-2 border-black shadow-xl">
            <CardHeader className="bg-black text-white">
              <CardTitle className="text-2xl font-bold">Admin Authentication</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="sign-in" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="sign-in" className="w-1/2 py-3">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="sign-up" className="w-1/2 py-3">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="sign-in" className="mt-4">
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-xl">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="text-xl">Password</Label>
                        <button
                          type="button"
                          onClick={() => setActiveTab('forgot-password')}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-6"
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="sign-up" className="mt-4">
                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="register-email" className="text-xl">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="register-password" className="text-xl">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="confirm-password" className="text-xl">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="admin-code" className="text-xl">Admin Registration Code</Label>
                      <Input
                        id="admin-code"
                        type="text"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-6"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="forgot-password" className="mt-4">
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="reset-email" className="text-xl">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-6"
                      disabled={loading}
                    >
                      {loading ? 'Sending Reset Link...' : 'Reset Password'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      className="w-full border-red-600 text-red-600 py-3 mt-4"
                      onClick={() => setActiveTab('sign-in')}
                    >
                      Back to Sign In
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </AnimatedSection>
        
        <AnimatedSection delay={0.4} className="text-center mt-8">
          <p className="text-gray-500">
            For assistance, please contact system administrator
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}
