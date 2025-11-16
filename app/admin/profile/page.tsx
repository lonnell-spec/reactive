'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Save } from 'lucide-react'
import { updateMyProfile } from '@/lib/profile-client-actions'
import { getProfileConfig } from '@/lib/profile-config-actions'
import { AdminMenu } from '@/components/AdminMenu'
import { formatPhoneNumber, stripPhoneFormatting } from '@/lib/phone-utils'
import Image from 'next/image'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  })
  const [profileConfig, setProfileConfig] = useState({
    emailConfirmRequired: false,
    phoneConfirmRequired: false
  })
  const router = useRouter()

  // Derived state from profile config
  const isEmailDisabled = !profileConfig.emailConfirmRequired
  const isPhoneDisabled = !profileConfig.phoneConfirmRequired
  const isFormDisabled = !profileConfig.emailConfirmRequired && !profileConfig.phoneConfirmRequired



  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientComponentClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin?redirect=' + encodeURIComponent('/admin/profile'))
        return
      }
      
      setUser(session.user)
      setFormData({
        email: session.user.email || '',
        phone: formatPhoneNumber(session.user.user_metadata?.phone || '')
      })
      
      // Load profile configuration from server
      try {
        const config = await getProfileConfig()
        setProfileConfig(config)
      } catch (error) {
        console.error('Failed to load profile config:', error)
        // Use defaults if config loading fails
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      // Strip formatting from phone number before sending to server
      const cleanPhone = stripPhoneFormatting(formData.phone)
      const result = await updateMyProfile(formData.email, cleanPhone)
      
      if (result.success) {
        setSuccess(result.message)
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      
      {/* Header */}
      <div className="bg-black text-white p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-4 justify-center sm:justify-start">
              <Image 
                src="/church-logo.png"
                alt="Church Logo" 
                width={40}
                height={40}
                className="filter brightness-0 invert"
              />
              <h1 className="text-lg sm:text-2xl font-bold text-center sm:text-left">My Profile</h1>
            </div>
            
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Admin Menu - Centered over content */}
        <div className="max-w-2xl mx-auto">
          <AdminMenu currentPath="/admin/profile" />
        </div>

        {/* Error/Success Messages */}
        {(error || success) && (
          <div className="mb-6 max-w-2xl mx-auto">
            <Alert className={`border-2 ${error ? 'border-red-600 bg-red-50' : 'border-green-600 bg-green-50'}`}>
              <AlertDescription className={`${error ? 'text-red-800' : 'text-green-800'}`}>
                {error || success}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Profile Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <User className="w-6 h-6 mr-2" />
              Update My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                  {isEmailDisabled && <span className="text-gray-400 ml-2">(Updating Disabled - Email settings on server need to be setup)</span>}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`mt-1 ${isEmailDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="your.email@example.com"
                  disabled={isEmailDisabled}
                />
           
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                  {isPhoneDisabled && <span className="text-gray-400 ml-2">(Updating Disabled - Phone settings on server need to be setup)</span>}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                  className={`mt-1 ${isPhoneDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder="(555) 123-4567"
                  disabled={isPhoneDisabled}
                />

              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving || isFormDisabled}
                  className={`${isFormDisabled 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isFormDisabled 
                    ? 'Profile Updates Disabled' 
                    : saving 
                      ? 'Saving...' 
                      : 'Save Changes'
                  }
                </Button>
              </div>
            </div>
          </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <div className="max-w-2xl mx-auto mt-6">
          <Card className="border-2 border-gray-200 shadow-md">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-blue-600 rounded-full mt-0.5 flex-shrink-0"></div>
                <div>
                  <strong>Email:</strong> Used for account login and email notifications. Changing this will require verification.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-green-600 rounded-full mt-0.5 flex-shrink-0"></div>
                <div>
                  <strong>Phone:</strong> Used for SMS notifications if you have admin or pre-approver roles assigned.
                </div>
              </div>
            </div>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
