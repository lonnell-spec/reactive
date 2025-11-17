'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Edit, Save, X, Shield, UserX } from 'lucide-react'
import { getAllUsers, updateUserRoles, UserProfile } from '@/lib/user-management-actions'
import { AdminMenu } from '@/components/AdminMenu'
import Image from 'next/image'

export default function UserManagementPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ roles: [] as string[] })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientComponentClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin?redirect=' + encodeURIComponent('/admin/users'))
        return
      }
      
      setUser(session.user)
      await loadUsers()
    }

    checkAuth()
  }, [router])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    
    try {
      const result = await getAllUsers()
      
      if (result.success && result.users) {
        setUsers(result.users)
      } else {
        setError(result.message || 'Failed to load users')
      }
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (userProfile: UserProfile) => {
    setEditingUser(userProfile.id)
    setEditForm({
      roles: [...userProfile.roles]
    })
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    setEditForm({ roles: [] })
  }

  const handleSaveUser = async (userId: string) => {
    setActionLoading(userId)
    setError('')
    setSuccess('')
    
    try {
      // Update roles
      const roleResult = await updateUserRoles(userId, editForm.roles)
      
      if (!roleResult.success) {
        setError(roleResult.message)
        return
      }

      setSuccess('User roles updated successfully')
      setEditingUser(null)
      await loadUsers()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to update user roles')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveAllRoles = async (userId: string) => {
    setActionLoading(userId)
    setError('')
    setSuccess('')
    
    try {
      const result = await updateUserRoles(userId, [])
      
      if (result.success) {
        setSuccess(result.message)
        await loadUsers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to remove roles')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleRole = (role: string) => {
    setEditForm(prev => ({
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
              <h1 className="text-lg sm:text-2xl font-bold text-center sm:text-left">User Management</h1>
            </div>
            
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Admin Menu */}
        <AdminMenu currentPath="/admin/users" />
        {/* Error/Success Messages */}
        {(error || success) && (
          <div className="mb-6">
            <Alert className={`border-2 ${error ? 'border-red-600 bg-red-50' : 'border-green-600 bg-green-50'}`}>
              <AlertDescription className={`${error ? 'text-red-800' : 'text-green-800'}`}>
                {error || success}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Users List */}
        <Card className="border-2 border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Users className="w-6 h-6 mr-2" />
              System Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No users found.</p>
            ) : (
              <div className="space-y-4">
                {users.map((userProfile) => (
                  <div key={userProfile.id} className="border border-gray-200 rounded-lg p-4">
                    {editingUser === userProfile.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">Roles (Select multiple)</Label>
                          <div className="flex flex-col sm:flex-row gap-2 mt-2">
                            <Button
                              type="button"
                              variant={editForm.roles.includes('admin') ? 'default' : 'outline'}
                              size="sm"
                              className={`w-full sm:w-auto ${editForm.roles.includes('admin') ? 'bg-red-600 hover:bg-red-700' : 'border-red-600 text-red-600'}`}
                              onClick={() => toggleRole('admin')}
                            >
                              {editForm.roles.includes('admin') ? '✓ ' : ''}Admin
                            </Button>
                            <Button
                              type="button"
                              variant={editForm.roles.includes('pre_approver') ? 'default' : 'outline'}
                              size="sm"
                              className={`w-full sm:w-auto ${editForm.roles.includes('pre_approver') ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-yellow-600 text-yellow-600'}`}
                              onClick={() => toggleRole('pre_approver')}
                            >
                              {editForm.roles.includes('pre_approver') ? '✓ ' : ''}Pre-Approver
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Users can have multiple roles. Click to toggle each role on/off.
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            onClick={() => handleSaveUser(userProfile.id)}
                            disabled={actionLoading === userProfile.id}
                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {actionLoading === userProfile.id ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={actionLoading === userProfile.id}
                            className="w-full sm:w-auto"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <h3 className="font-semibold text-lg">{userProfile.email}</h3>
                            <div className="flex flex-wrap gap-1">
                              {userProfile.roles.map(role => (
                                <span key={role} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  role === 'admin' 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  <Shield className="w-3 h-3 mr-1" />
                                  {role === 'admin' ? 'Admin' : 'Pre-Approver'}
                                </span>
                              ))}
                              {userProfile.roles.length === 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No Roles
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <p>Phone: {userProfile.phone || 'Not provided'}</p>
                            <p>Joined: {formatDate(userProfile.created_at)}</p>
                            {userProfile.id === user?.id && (
                              <p className="text-blue-600 font-medium">(This is you)</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(userProfile)}
                            disabled={actionLoading === userProfile.id}
                            className="w-full sm:w-auto"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Roles
                          </Button>
                          {userProfile.roles.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveAllRoles(userProfile.id)}
                              disabled={actionLoading === userProfile.id}
                              className="w-full sm:w-auto border-red-600 text-red-600 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              {actionLoading === userProfile.id ? 'Removing...' : 'Remove All Roles'}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-2 border-gray-200 shadow-md mt-6">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Role Permissions</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-red-600 rounded-full mt-0.5 flex-shrink-0"></div>
                <div>
                  <strong>Admin:</strong> Full access to the admin dashboard. Receives notifications for final approvals.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-yellow-600 rounded-full mt-0.5 flex-shrink-0"></div>
                <div>
                  <strong>Pre-Approver:</strong> Full access to the admin dashboard. Receives notifications for pre-approval requests.
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
