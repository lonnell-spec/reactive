'use client'

import React, { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, LogIn, AlertCircle, CheckCircle } from 'lucide-react'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { motion } from 'motion/react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { signInUser, registerUser, requestPasswordReset } from '@/lib/auth-client-actions'
import { getAuthConfig } from '@/lib/profile-config-actions'
import { PhoneInput } from './ui/phone-input'
import { FormFieldError } from './forms/FormFieldError'
import { stripPhoneFormatting } from '@/lib/phone-utils'
import { 
  registrationFormSchema, 
  loginFormSchema, 
  forgotPasswordFormSchema,
  type RegistrationFormData,
  type LoginFormData,
  type ForgotPasswordFormData
} from '@/lib/admin-auth-types'

interface AdminLoginProps {
  onLogin: (accessToken: string, user: any) => void
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('sign-in')
  const [authConfig, setAuthConfig] = useState({
    emailConfirmationConfigured: false
  })

  const supabase = createClientComponentClient()

  // React Hook Form instances
  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      adminCode: ''
    }
  })

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: ''
    }
  })

  // Load auth configuration on component mount
  useEffect(() => {
    const loadAuthConfig = async () => {
      try {
        const config = await getAuthConfig()
        setAuthConfig(config)
      } catch (error) {
        console.error('Failed to load auth config:', error)
        // Use defaults if config loading fails
      }
    }
    
    loadAuthConfig()
  }, [])

  const handleSignIn = async (data: LoginFormData) => {
    setLoading(true)
    setError('')
    setMessage('')
    
    const result = await signInUser(data.email, data.password)
    
    if (result.success) {
      onLogin(result.session!.access_token, result.user)
    } else {
      setError(result.message)
    }
    
    setLoading(false)
  }
  
  const handleSignUp = async (data: RegistrationFormData) => {
    setLoading(true)
    setError('')
    setMessage('')
    
    // Strip phone formatting before sending to server
    const cleanPhone = stripPhoneFormatting(data.phone)
    const result = await registerUser(data.email, data.password, data.confirmPassword, cleanPhone, data.adminCode)
    
    if (result.success) {
      setMessage(result.message)
      setActiveTab('sign-in')
      
      // Reset form
      registrationForm.reset()
    } else {
      setError(result.message)
    }
    
    setLoading(false)
  }
  
  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    // Check if email confirmation is configured
    if (!authConfig.emailConfirmationConfigured) {
      setError('Password reset is disabled because email confirmation is not configured.')
      return
    }
    
    setLoading(true)
    setError('')
    setMessage('')
    
    const result = await requestPasswordReset(data.email)
    
    if (result.success) {
      setMessage(result.message)
    } else {
      setError(result.message)
    }
    
    setLoading(false)
  }
  
  return (
    <div className="min-h-screen bg-white py-12 px-4">
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
                  <form onSubmit={loginForm.handleSubmit(handleSignIn)} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="login-email" className="text-xl">Email</Label>
                      <div className="relative">
                        <Controller
                          name="email"
                          control={loginForm.control}
                          render={({ field }) => (
                            <Input
                              id="login-email"
                              type="email"
                              {...field}
                              className={`border-2 ${loginForm.formState.errors.email ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                            />
                          )}
                        />
                        {loginForm.formState.errors.email && (
                          <FormFieldError message={loginForm.formState.errors.email.message || 'Email is required'} />
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
                        <Label htmlFor="login-password" className="text-xl">Password</Label>
                        {authConfig.emailConfirmationConfigured ? (
                          <button
                            type="button"
                            onClick={() => setActiveTab('forgot-password')}
                            className="text-xs sm:text-sm text-red-600 hover:underline self-start sm:self-auto"
                          >
                            Forgot Password?
                          </button>
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-400 cursor-not-allowed self-start sm:self-auto">
                            Password Reset Disabled
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Controller
                          name="password"
                          control={loginForm.control}
                          render={({ field }) => (
                            <Input
                              id="login-password"
                              type="password"
                              {...field}
                              className={`border-2 ${loginForm.formState.errors.password ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                            />
                          )}
                        />
                        {loginForm.formState.errors.password && (
                          <FormFieldError message={loginForm.formState.errors.password.message || 'Password is required'} />
                        )}
                      </div>
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
                  <form onSubmit={registrationForm.handleSubmit(handleSignUp)} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="register-email" className="text-xl">Email</Label>
                      <div className="relative">
                        <Controller
                          name="email"
                          control={registrationForm.control}
                          render={({ field }) => (
                            <Input
                              id="register-email"
                              type="email"
                              {...field}
                              className={`border-2 ${registrationForm.formState.errors.email ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                            />
                          )}
                        />
                        {registrationForm.formState.errors.email && (
                          <FormFieldError message={registrationForm.formState.errors.email.message || 'Email is required'} />
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="register-password" className="text-xl">Password</Label>
                      <div className="relative">
                        <Controller
                          name="password"
                          control={registrationForm.control}
                          render={({ field }) => (
                            <Input
                              id="register-password"
                              type="password"
                              {...field}
                              className={`border-2 ${registrationForm.formState.errors.password ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                            />
                          )}
                        />
                        {registrationForm.formState.errors.password && (
                          <FormFieldError message={registrationForm.formState.errors.password.message || 'Password is required'} />
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="confirm-password" className="text-xl">Confirm Password</Label>
                      <div className="relative">
                        <Controller
                          name="confirmPassword"
                          control={registrationForm.control}
                          render={({ field }) => (
                            <Input
                              id="confirm-password"
                              type="password"
                              {...field}
                              className={`border-2 ${registrationForm.formState.errors.confirmPassword ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                            />
                          )}
                        />
                        {registrationForm.formState.errors.confirmPassword && (
                          <FormFieldError message={registrationForm.formState.errors.confirmPassword.message || 'Please confirm your password'} />
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="register-phone" className="text-xl">Phone Number</Label>
                      <div className="relative">
                        <Controller
                          name="phone"
                          control={registrationForm.control}
                          render={({ field: { onChange, value, name, ref } }) => (
                            <PhoneInput
                              id="register-phone"
                              name={name}
                              ref={ref}
                              value={value || ''}
                              onChange={onChange}
                              className={`border-2 ${registrationForm.formState.errors.phone ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                            />
                          )}
                        />
                        {registrationForm.formState.errors.phone && (
                          <FormFieldError message={registrationForm.formState.errors.phone.message || 'Phone number must be exactly 10 digits'} />
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="admin-code" className="text-xl flex items-center">
                        Registration Code
                        <div className="ml-2 text-sm text-gray-500">(Required)</div>
                      </Label>
                      <div className="relative">
                        <Controller
                          name="adminCode"
                          control={registrationForm.control}
                          render={({ field }) => (
                            <Input
                              id="admin-code"
                              type="text"
                              {...field}
                              className={`border-2 ${registrationForm.formState.errors.adminCode ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                              placeholder="Enter registration code"
                            />
                          )}
                        />
                        {registrationForm.formState.errors.adminCode && (
                          <FormFieldError message={registrationForm.formState.errors.adminCode.message || 'Registration code is required'} />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        <AlertCircle className="inline-block w-4 h-4 mr-1" />
                        This code is required to register as an admin user.
                      </p>
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
                  <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="reset-email" className="text-xl">Email</Label>
                      <div className="relative">
                        <Controller
                          name="email"
                          control={forgotPasswordForm.control}
                          render={({ field }) => (
                            <Input
                              id="reset-email"
                              type="email"
                              {...field}
                              className={`border-2 ${forgotPasswordForm.formState.errors.email ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                            />
                          )}
                        />
                        {forgotPasswordForm.formState.errors.email && (
                          <FormFieldError message={forgotPasswordForm.formState.errors.email.message || 'Email is required'} />
                        )}
                      </div>
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
            User roles and permissions can be managed from the admin dashboard.
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}
