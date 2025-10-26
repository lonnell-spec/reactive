'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, LogIn, Settings, AlertCircle, CheckCircle } from 'lucide-react'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { FloatingElements } from './FloatingElements'
import { motion } from 'motion/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { validateRegistrationCode, createUserWithRole } from '@/lib/auth-actions'

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
  const [userRole, setUserRole] = useState('admin')

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
      
      // Verify the registration code for the selected role using server action
      const validationResult = await validateRegistrationCode(adminCode, userRole)
      
      if (!validationResult.isValid) {
        throw new Error(validationResult.message)
      }

      // Create user account using server action
      const createResult = await createUserWithRole(email, password, userRole)
      
      if (!createResult.success) {
        throw new Error(createResult.message)
      }
      
      setMessage('Account created successfully! Please sign in.')
      setActiveTab('sign-in')
      
      // Reset form
      setAdminCode('')
      setPassword('')
      setConfirmPassword('')
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
              <div className="flex items-start">
                {error ? 
                  <AlertCircle className="w-6 h-6 mr-3 text-red-600 flex-shrink-0 mt-1" /> : 
                  <CheckCircle className="w-6 h-6 mr-3 text-green-600 flex-shrink-0 mt-1" />
                }
                <AlertDescription className={`${error ? 'text-red-800' : 'text-green-800'} text-xl`}>
                  {error || message}
                </AlertDescription>
              </div>
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
                      <Label htmlFor="admin-code" className="text-xl flex items-center">
                        {userRole === 'pre_approver' && 'Pre-Approver'}
                        {userRole === 'pending_approver' && 'Approver'}
                        {userRole === 'admin' && 'Admin'}
                        {' Registration Code'}
                        <div className="ml-2 text-sm text-gray-500">(Required)</div>
                      </Label>
                      <Input
                        id="admin-code"
                        type="text"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        required
                        className={`border-2 ${userRole === 'pre_approver' ? 'focus:border-yellow-600' : userRole === 'pending_approver' ? 'focus:border-blue-600' : 'focus:border-red-600'} py-4`}
                        placeholder={`Enter ${userRole === 'pre_approver' ? 'Pre-Approver' : userRole === 'pending_approver' ? 'Approver' : 'Admin'} code`}
                      />
                      <p className="text-sm text-gray-500">
                        <AlertCircle className="inline-block w-4 h-4 mr-1" />
                        This code is required to register as a{userRole === 'pre_approver' ? ' Pre-Approver' : userRole === 'pending_approver' ? 'n Approver' : 'n Admin'}.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="user-role" className="text-xl">User Role</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                          type="button"
                          variant={userRole === 'pre_approver' ? 'default' : 'outline'}
                          className={userRole === 'pre_approver' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'border-yellow-600 text-yellow-600'}
                          onClick={() => {
                            setUserRole('pre_approver')
                            setAdminCode('') // Clear code when changing roles
                          }}
                        >
                          Pre-Approver
                        </Button>
                        <Button
                          type="button"
                          variant={userRole === 'pending_approver' ? 'default' : 'outline'}
                          className={userRole === 'pending_approver' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-600 text-blue-600'}
                          onClick={() => {
                            setUserRole('pending_approver')
                            setAdminCode('') // Clear code when changing roles
                          }}
                        >
                          Approver
                        </Button>
                        <Button
                          type="button"
                          variant={userRole === 'admin' ? 'default' : 'outline'}
                          className={userRole === 'admin' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-600 text-red-600'}
                          onClick={() => {
                            setUserRole('admin')
                            setAdminCode('') // Clear code when changing roles
                          }}
                        >
                          Admin
                        </Button>
                      </div>
                      <div className={`p-4 rounded-md ${userRole === 'pre_approver' ? 'bg-yellow-50 border border-yellow-200' : userRole === 'pending_approver' ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
                        <h4 className={`font-medium mb-1 ${userRole === 'pre_approver' ? 'text-yellow-800' : userRole === 'pending_approver' ? 'text-blue-800' : 'text-red-800'}`}>
                          {userRole === 'pre_approver' ? 'Pre-Approver' : userRole === 'pending_approver' ? 'Approver' : 'Admin'} Role
                        </h4>
                        <p className="text-sm text-gray-700">
                          {userRole === 'pre_approver' && 'Pre-Approvers can review and pre-approve new guest registrations. You will only see pending pre-approval submissions.'}
                          {userRole === 'pending_approver' && 'Approvers can approve or deny pre-approved guest registrations. You will only see pending submissions that have been pre-approved.'}
                          {userRole === 'admin' && 'Admins have full access to all guest registrations and approvals. You will see all submissions regardless of status.'}
                        </p>
                      </div>
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
          <p className="text-sm text-gray-400 mt-2">
            Pre-Approvers can only see pending pre-approval guests.<br />
            Approvers can only see pre-approved guests awaiting final approval.
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}
