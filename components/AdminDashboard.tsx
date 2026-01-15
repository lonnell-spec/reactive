'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { GuestStatus } from '@/lib/types'
import { preApproveGuest, denyPreApproval, approveGuest, denyGuest } from '@/lib/admin-actions'
// Removed role-based filtering - all users see all data
import { formatGuestDataList, Submission } from '@/lib/data-formatting-utils'
import { GuestDetailsModal } from './GuestDetailsModal'
import { GuestListing } from './GuestListing'
import { AdminMenu } from './AdminMenu'
import { formatTimestamp, getRelativeTime as getRelativeTimeUtil, formatVisitDate } from '@/lib/date-timezone-utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
// No test utils import needed

interface AdminDashboardProps {
  user: any
  onLogout: () => void
  initialExternalGuestId?: string
}



export function AdminDashboard({ user, onLogout, initialExternalGuestId }: AdminDashboardProps) {
  const router = useRouter()
  const [guestSubmissions, setGuestSubmissions] = useState<Submission[]>([])
  const [completedSubmissions, setCompletedSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSubmission, setActiveSubmission] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  // Removed role-based state - all users have access to all functionality
  const [loadingSpecificGuest, setLoadingSpecificGuest] = useState(false)
  const [hasProcessedInitialGuest, setHasProcessedInitialGuest] = useState(false)

  // Load submissions on mount
  useEffect(() => {
    loadSubmissions()
  }, [])

  // Handle initial external guest ID after submissions are loaded
  useEffect(() => {
    if (initialExternalGuestId && !loading && !loadingSpecificGuest && !hasProcessedInitialGuest && (guestSubmissions.length > 0 || completedSubmissions.length > 0)) {
      loadSpecificGuest(initialExternalGuestId)
      setHasProcessedInitialGuest(true)
    }
  }, [initialExternalGuestId, loading, loadingSpecificGuest, hasProcessedInitialGuest, guestSubmissions, completedSubmissions])
  
  // Load all submissions based on user roles
  const loadSubmissions = async () => {
    setLoading(true)
    setError('')
    
    try {
      
      // Load pending guest submissions (pending_pre_approval and pending)
      await loadGuestSubmissions();
      
      // Always load completed submissions
      await loadCompletedSubmissions();
    } catch (err) {
      setError('Failed to load submissions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Removed role checking - all authenticated users have access

  // Find guest by external_guest_id and return internal id
  const findGuestByExternalId = async (externalGuestId: string): Promise<string | null> => {
    try {
      const supabaseAuthClient = createClientComponentClient()
      const { data, error } = await supabaseAuthClient
        .from('guests')
        .select('id')
        .eq('external_guest_id', externalGuestId)
        .single()
      
      if (error || !data) {
        return null
      }
      
      return data.id
    } catch (err) {
      return null
    }
  }

  // Load specific guest by external ID after submissions are loaded
  const loadSpecificGuest = async (externalGuestId: string) => {
    setLoadingSpecificGuest(true)
    try {
      const internalId = await findGuestByExternalId(externalGuestId)
      
      if (internalId) {
        // Check if the guest is in our loaded submissions
        const allSubmissions = [...guestSubmissions, ...completedSubmissions]
        const foundSubmission = allSubmissions.find(sub => sub.id === internalId)
        
        if (foundSubmission) {
          setActiveSubmission(internalId)
        } else {
          setError(`Guest submission not found or you don't have permission to view it.`)
        }
      } else {
        setError(`Invalid guest link. The guest submission could not be found.`)
      }
    } catch (err) {
      setError('Failed to load specific guest submission.')
    } finally {
      setLoadingSpecificGuest(false)
    }
  }

  const loadGuestSubmissions = async () => {
    setLoading(true)
    try {
      const supabaseAuthClient = createClientComponentClient()
      // Query Supabase for active guest submissions (pending_pre_approval and pending)
      // Filter out completed statuses (approved, denied, pre_approval_denied)
      const { data, error: queryError } = await supabaseAuthClient
        .from('guests')
        .select(`
          *,
          guest_children (*)
        `)
        .in('status', [GuestStatus.PENDING_PRE_APPROVAL, GuestStatus.PENDING])
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        setGuestSubmissions([]);
        return;
      }

      // Transform data to match our component's expected format
      const formattedSubmissions = await formatGuestDataList(data);

      setGuestSubmissions(formattedSubmissions);
      
      if (formattedSubmissions.length === 0) {
        setStatusMsg('No pending submissions found.');
      } else {
        setStatusMsg('');
      }
    } catch (err) {
      setError('Failed to load guest submissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePreApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const result = await preApproveGuest(id, user.email)
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      // Close the active submission view
      setActiveSubmission(null)
      
      // Reload submissions to get updated data
      loadSubmissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pre-approve guest')
    } finally {
      setActionLoading(null)
    }
  }
  
  const handlePreApprovalDeny = async (id: string) => {
    setActionLoading(id)
    try {
      const result = await denyPreApproval(id, user.email, "Your pre-approval request has been denied.")
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      // Close the active submission view
      setActiveSubmission(null)
      
      // Reload submissions to get updated data
      loadSubmissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny pre-approval for guest')
    } finally {
      setActionLoading(null)
    }
  }
  
  // Load completed submissions
  const loadCompletedSubmissions = async () => {
    try {
      const supabaseAuthClient = createClientComponentClient()
      // Query Supabase for completed submissions
      const { data, error: queryError } = await supabaseAuthClient
        .from('guests')
        .select(`
          *,
          guest_children (*)
        `)
        .in('status', [GuestStatus.APPROVED, GuestStatus.DENIED, GuestStatus.PRE_APPROVAL_DENIED])
        .order('updated_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        setCompletedSubmissions([]);
        return;
      }

      // Transform data to match our component's expected format
      const formattedSubmissions = await formatGuestDataList(data);

      setCompletedSubmissions(formattedSubmissions);
    } catch (err) {
      // Don't set the error state as this is not critical
    }
  }


  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const result = await approveGuest(id, user.email)
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      // Close the active submission view
      setActiveSubmission(null)
      
      // Reload submissions to get updated data
      loadSubmissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve guest')
    } finally {
      setActionLoading(null)
    }
  }
  
  const handleDeny = async (id: string) => {
    setActionLoading(id)
    try {
      const result = await denyGuest(id, user.email, "Your registration has been denied by an administrator.")
      
      if (!result.success) {
        throw new Error(result.message)
      }
      
      // Close the active submission view
      setActiveSubmission(null)
      
      // Reload submissions to get updated data
      loadSubmissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny guest')
    } finally {
      setActionLoading(null)
    }
  }
  
  // Get formatted date - handles both visit dates (simple strings) and timestamps
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    
    // Check if it's a timestamp (contains 'T' or 'Z') or simple date
    if (dateString.includes('T') || dateString.includes('Z')) {
      // It's a timestamp (like preApprovedAt, submittedAt)
      return formatTimestamp(dateString, {
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } else {
      // It's a simple date string (like visitDate)
      return formatVisitDate(dateString, {
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    }
  }
  
  // Get relative time using the centralized utility
  const getRelativeTime = (timestampString: string) => {
    return getRelativeTimeUtil(timestampString)
  }
  


  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      
      {/* Top navigation bar */}
      <div className="bg-black text-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <Image 
              src="/church-logo.png"
              alt="Church Logo" 
              width={40}
              height={40}
              className="filter brightness-0 invert"
            />
            <h1 className="text-xl sm:text-2xl font-bold">2819 Church Admin</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4 w-full lg:w-auto">
            {/* Avatar and email - first in order */}
            <div className="flex items-center gap-3 order-1 sm:order-1">
              <Avatar>
                <AvatarFallback className="bg-red-600 text-white">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
                {user.user_metadata?.avatar_url && (
                  <AvatarImage src={user.user_metadata.avatar_url} />
                )}
              </Avatar>
              
              <span className="text-sm hidden lg:inline-block">
                {user.email}
              </span>
            </div>
            
            {/* Sign Out */}
            <Button 
              variant="outline"
              size="sm"
              className="border-white text-white hover:bg-red-600 w-full sm:w-auto flex-shrink-0"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Admin Menu */}
        <AdminMenu currentPath="/admin" />

        {/* Header and controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Guest Registration Admin</h2>
            <p className="text-gray-600">
              Review and manage guest registration requests
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex gap-2">
              <Button
                onClick={loadSubmissions}
                variant="outline"
                className="border-red-600 text-red-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <Alert className="border-2 border-red-600 bg-red-50 mb-8">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        
        {/* Main content */}
        <div className="grid grid-cols-1 gap-8">
          {loading ? (
            <Card className="border-2 border-gray-200 shadow-md">
              <CardContent className="p-8 flex justify-center items-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-8 animate-spin" />
                  <p className="text-xl text-black">Loading submissions...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Guest Submissions */}
              <div className="mb-8">
                <GuestListing
                  title="Guest Submissions"
                  submissions={guestSubmissions}
                  onSubmissionClick={setActiveSubmission}
                  onRefresh={loadSubmissions}
                  formatDate={formatDate}
                  getRelativeTime={getRelativeTime}
                  emptyMessage="No guest submissions found."
                />
              </div>
              
              {/* Completed Submissions */}
              {completedSubmissions.length > 0 && (
                <GuestListing
                  title="Processed Guests (Approved/Denied)"
                  submissions={completedSubmissions}
                  onSubmissionClick={setActiveSubmission}
                  formatDate={formatDate}
                  getRelativeTime={getRelativeTime}
                  headerClassName="bg-gray-100"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal rendered outside main content flow */}
      <GuestDetailsModal
        submission={[...guestSubmissions, ...completedSubmissions].find(sub => sub.id === activeSubmission) || null}
        // Removed userRoles - all users have access to all actions
        actionLoading={actionLoading}
        onClose={() => setActiveSubmission(null)}
        onPreApprove={handlePreApprove}
        onPreApprovalDeny={handlePreApprovalDeny}
        onApprove={handleApprove}
        onDeny={handleDeny}
        getRelativeTime={getRelativeTime}
        formatDate={formatDate}
      />
    </div>
  )
}
