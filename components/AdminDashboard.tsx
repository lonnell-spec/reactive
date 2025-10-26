'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, Clock, LogOut, Users, Calendar, Car, Heart, MessageSquare, Phone, Mail, Baby, RefreshCw, Bug, Database } from 'lucide-react'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { FloatingElements } from './FloatingElements'
import { motion } from 'motion/react'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { GuestStatus } from '@/lib/types'
import { ensureUserRole } from '@/lib/auth-actions'
import { createTestGuest, testRlsPolicies } from '@/lib/test-utils'

interface AdminDashboardProps {
  user: any
  onLogout: () => void
}

interface UserRoles {
  isPreApprover: boolean
  isPendingApprover: boolean
}

interface Submission {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  visitDate: string
  gatheringTime: string
  totalGuests: number
  hasChildrenForFormationKids: boolean
  childrenInfo: Array<{
    name: string
    dob: string
    allergies: string
  }>
  carType: string
  vehicleColor: string
  vehicleMake: string
  vehicleModel: string
  foodAllergies: string
  specialNeeds: string
  additionalNotes: string
  status: string
  profilePicture: string
  submittedAt: string
  preApprovedBy?: string
  preApprovedAt?: string
  preApprovalDeniedBy?: string
  preApprovalDeniedAt?: string
  approvedBy?: string
  approvedAt?: string
  deniedBy?: string
  deniedAt?: string
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [pendingPreApprovalSubmissions, setPendingPreApprovalSubmissions] = useState<Submission[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([])
  const [completedSubmissions, setCompletedSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeSubmission, setActiveSubmission] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'unknown'>('unknown')
  const [statusMsg, setStatusMsg] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [userRoles, setUserRoles] = useState<UserRoles>({ isPreApprover: false, isPendingApprover: false })
  const [debugMode, setDebugMode] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  
  const supabase = createClientComponentClient()

  // Check user roles on mount
  useEffect(() => {
    const checkRoles = async () => {
      await checkUserRoles();
    };
    checkRoles();
  }, [user])

  // Load submissions based on roles
  useEffect(() => {
    loadSubmissions()
    checkSystemStatus()
  }, [userRoles, showCompleted])
  
  // Load all submissions based on user roles
  const loadSubmissions = async () => {
    setLoading(true)
    setError('')
    
    try {
      console.log('======== LOADING SUBMISSIONS ========');
      console.log('User roles:', JSON.stringify(userRoles));
      
      // Force check user roles before loading submissions
      // This is a workaround for the issue where userRoles state isn't updating properly
      const userRole = user.app_metadata?.role || user.user_metadata?.role || '';
      const isAdmin = userRole === 'admin';
      const isPreApprover = isAdmin || 
                          userRole === 'pre_approver' || 
                          (typeof userRole === 'string' && userRole.includes('pre_approver'));
      const isPendingApprover = isAdmin || 
                             userRole === 'pending_approver' || 
                             (typeof userRole === 'string' && userRole.includes('pending_approver'));
      
      console.log('Direct role check:', { userRole, isPreApprover, isPendingApprover });
      
      // Update state to match direct check
      if (userRoles.isPreApprover !== isPreApprover || userRoles.isPendingApprover !== isPendingApprover) {
        console.log('⚠️ Fixing userRoles state to match direct check');
        setUserRoles({ isPreApprover, isPendingApprover });
      }
      
      if (isPreApprover) {
        console.log('🔍 USER IS PRE-APPROVER - Loading pending pre-approval submissions');
        await loadPendingPreApprovalSubmissions()
      } else {
        console.log('⚠️ USER IS NOT PRE-APPROVER - Skipping pending pre-approval submissions');
      }
      
      if (isPendingApprover) {
        console.log('🔍 USER IS PENDING-APPROVER - Loading pending submissions');
        await loadPendingSubmissions()
      } else {
        console.log('⚠️ USER IS NOT PENDING-APPROVER - Skipping pending submissions');
      }
      
      if (showCompleted) {
        console.log('🔍 SHOWING COMPLETED - Loading completed submissions');
        await loadCompletedSubmissions()
      } else {
        console.log('ℹ️ NOT SHOWING COMPLETED - Skipping completed submissions');
      }
      console.log('======== FINISHED LOADING SUBMISSIONS ========');
    } catch (err) {
      console.error('❌ ERROR LOADING SUBMISSIONS:', err)
      setError('Failed to load submissions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const checkUserRoles = async () => {
    try {
      // Check if user has pre-approver or pending-approver roles
      console.log('Checking user roles for user ID:', user.id);
      console.log('User app_metadata:', JSON.stringify(user.app_metadata, null, 2));
      console.log('User user_metadata:', JSON.stringify(user.user_metadata, null, 2));
      
      // Get JWT to check what's actually in the token
      const { data: { session } } = await supabase.auth.getSession();
      console.log('JWT claims:', session?.access_token ? 'Token exists' : 'No token');
      console.log('JWT claims access_token:', session?.access_token);
      if (session?.access_token) {
        // Decode JWT to see what's in it (this is just for debugging)
        try {
          const base64Url = session.access_token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const payload = JSON.parse(jsonPayload);
          console.log('Decoded JWT payload:', payload);
        } catch (e) {
          console.error('Error decoding JWT:', e);
        }
      }
      
      // First check app_metadata, then user_metadata
      const userRole = user.app_metadata?.role || user.user_metadata?.role || '';
      console.log('Extracted userRole:', userRole);
      
      // If role is only in user_metadata but not in app_metadata, fix it
      if (!user.app_metadata?.role && user.user_metadata?.role) {
        console.log('Role found in user_metadata but not in app_metadata, fixing...');
        const result = await ensureUserRole(user.id, user.user_metadata.role);
        console.log('Role fix result:', result);
        
        // If the fix was successful, reload the page to get the updated user data
        if (result.success) {
          console.log('Role fixed successfully, reloading page...');
          window.location.reload();
          return;
        }
      }
      
      // Check if user has admin role (can see everything)
      const isAdmin = userRole === 'admin';
      
      // Check for specific roles or role patterns
      const isPreApprover = isAdmin || 
                          userRole === 'pre_approver' || 
                          (typeof userRole === 'string' && userRole.includes('pre_approver'));
                          
      const isPendingApprover = isAdmin || 
                             userRole === 'pending_approver' || 
                             (typeof userRole === 'string' && userRole.includes('pending_approver'));
      
      setUserRoles({ isPreApprover, isPendingApprover });
      
      console.log('User roles determined:', { isPreApprover, isPendingApprover, userRole });
      
      // Force a direct role update to ensure it's set correctly
      if (isPreApprover || isPendingApprover) {
        console.log('Forcing role update for user...');
        let roleToSet = '';
        if (isPreApprover && isPendingApprover) {
          roleToSet = 'pre_approver,pending_approver';
        } else if (isPreApprover) {
          roleToSet = 'pre_approver';
        } else if (isPendingApprover) {
          roleToSet = 'pending_approver';
        }
        
        if (roleToSet) {
          const result = await ensureUserRole(user.id, roleToSet);
          console.log('Force role update result:', result);
          
          if (result.success && JSON.stringify(user.app_metadata?.role) !== JSON.stringify(roleToSet)) {
            console.log('Role updated, reloading page...');
            window.location.reload();
            return;
          }
        }
      }
    } catch (err) {
      console.error('Error checking user roles:', err);
      // Default to no permissions
      setUserRoles({ isPreApprover: false, isPendingApprover: false });
    }
  }

  const checkSystemStatus = async () => {
    try {
      // This would call your edge function health check endpoint
      // For demo purposes we'll just set it to online
      setSystemStatus('online')
    } catch (err) {
      console.error('System status check error:', err)
      setSystemStatus('offline')
    }
  }

  const loadPendingPreApprovalSubmissions = async () => {
    setLoading(true)
    try {
      console.log('\n\n==== 🔍 DEBUGGING PRE-APPROVAL SUBMISSIONS QUERY ====');
      console.log('GuestStatus.PENDING_PRE_APPROVAL =', GuestStatus.PENDING_PRE_APPROVAL);
      
      // First, try a direct query to check if any records exist at all
      console.log('\n📊 QUERY 1: Checking if ANY guests exist in the database...');
      const { data: allData, error: allDataError } = await supabase
        .from('guests')
        .select('id, status')
        .limit(100);
        
      if (allDataError) {
        console.error('❌ ERROR querying all guests:', allDataError.message);
      } else if (!allData || allData.length === 0) {
        console.warn('⚠️ NO GUESTS FOUND IN DATABASE AT ALL!');
      } else {
        console.log('✅ Found', allData.length, 'guests in database');
        console.log('📊 Guest statuses in database:', 
          allData.map(g => g.status)
            .filter((v, i, a) => a.indexOf(v) === i)
            .map(status => `"${status}"`)  // Show with quotes to see exact string
        );
        console.log('📝 First few guest records:', allData.slice(0, 3));
      }
      
      // Now query specifically for pending_pre_approval status using enum
      console.log('\n📊 QUERY 2: Looking for guests with status = GuestStatus.PENDING_PRE_APPROVAL...');
      const { data, error: queryError } = await supabase
        .from('guests')
        .select(`
          *,
          guest_children (*)
        `)
        .eq('status', GuestStatus.PENDING_PRE_APPROVAL)
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('❌ ERROR in pre-approval query:', queryError.message);
      } else if (!data || data.length === 0) {
        console.warn('⚠️ NO PRE-APPROVAL GUESTS FOUND USING ENUM!');
      } else {
        console.log('✅ Found', data.length, 'pre-approval guests using enum');
        console.log('📝 First pre-approval guest:', {
          id: data[0].id,
          name: `${data[0].first_name} ${data[0].last_name}`,
          status: data[0].status,
          created_at: data[0].created_at
        });
      }
      
      // Try a raw string query as well to rule out enum issues
      console.log('\n📊 QUERY 3: Looking for guests with status = "pending_pre_approval" (raw string)...');
      const { data: rawData, error: rawError } = await supabase
        .from('guests')
        .select('id, first_name, last_name, status, created_at')
        .eq('status', 'pending_pre_approval')
        .limit(10);
        
      if (rawError) {
        console.error('❌ ERROR in raw string query:', rawError.message);
      } else if (!rawData || rawData.length === 0) {
        console.warn('⚠️ NO PRE-APPROVAL GUESTS FOUND USING RAW STRING!');
      } else {
        console.log('✅ Found', rawData.length, 'pre-approval guests using raw string');
        console.log('📝 First pre-approval guest (raw query):', rawData[0]);
      }
      
      console.log('\n📊 QUERY SUMMARY:');
      console.log('- Total guests in DB:', allData?.length || 0);
      console.log('- Pre-approval guests (enum):', data?.length || 0);
      console.log('- Pre-approval guests (raw):', rawData?.length || 0);
      console.log('==== END DEBUGGING PRE-APPROVAL SUBMISSIONS ====\n\n');

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        console.log('No pre-approval data found');
        setPendingPreApprovalSubmissions([]);
        return;
      }
      
      console.log('Found pre-approval submissions:', data.length);

      // Transform data to match our component's expected format
      const formattedSubmissions: Submission[] = data.map(guest => ({
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        email: guest.email || '',
        phone: guest.phone,
        visitDate: guest.visit_date,
        gatheringTime: guest.gathering_time,
        totalGuests: guest.total_guests,
        hasChildrenForFormationKids: guest.should_enroll_children,
        childrenInfo: guest.guest_children || [],
        carType: guest.vehicle_type,
        vehicleColor: guest.vehicle_color || '',
        vehicleMake: guest.vehicle_make || '',
        vehicleModel: guest.vehicle_model || '',
        foodAllergies: guest.food_allergies || '',
        specialNeeds: guest.special_needs || '',
        additionalNotes: guest.additional_notes || '',
        status: guest.status,
        profilePicture: guest.photo_path || '',
        submittedAt: guest.created_at,
        preApprovedBy: guest.pre_approved_by,
        preApprovedAt: guest.pre_approved_at,
      }));

      setPendingPreApprovalSubmissions(formattedSubmissions);
      
    } catch (err) {
      console.error('Error loading pre-approval submissions:', err);
      setError('Failed to load pre-approval submissions');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingSubmissions = async () => {
    setLoading(true)
    try {
      // Determine which statuses to load
      const statuses = showCompleted 
        ? [GuestStatus.PENDING, GuestStatus.APPROVED, GuestStatus.DENIED] 
        : [GuestStatus.PENDING];
      
      // Query Supabase for guest submissions
      const { data, error: queryError } = await supabase
        .from('guests')
        .select(`
          *,
          guest_children (*)
        `)
        .in('status', statuses)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        setPendingSubmissions([]);
        return;
      }

      // Transform data to match our component's expected format
      const formattedSubmissions: Submission[] = data.map(guest => ({
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        email: guest.email || '',
        phone: guest.phone,
        visitDate: guest.visit_date,
        gatheringTime: guest.gathering_time,
        totalGuests: guest.total_guests,
        hasChildrenForFormationKids: guest.should_enroll_children,
        childrenInfo: guest.guest_children || [],
        carType: guest.vehicle_type,
        vehicleColor: guest.vehicle_color || '',
        vehicleMake: guest.vehicle_make || '',
        vehicleModel: guest.vehicle_model || '',
        foodAllergies: guest.food_allergies || '',
        specialNeeds: guest.special_needs || '',
        additionalNotes: guest.additional_notes || '',
        status: guest.status,
        profilePicture: guest.photo_path || '',
        submittedAt: guest.created_at,
        preApprovedBy: guest.pre_approved_by,
        preApprovedAt: guest.pre_approved_at,
      }));

      setPendingSubmissions(formattedSubmissions);
      
      if (formattedSubmissions.length === 0) {
        setStatusMsg(showCompleted 
          ? 'No submissions found.' 
          : 'No pending submissions. All guests have been processed.');
      } else {
        setStatusMsg('');
      }
      
    } catch (err) {
      console.error('Error loading pending submissions:', err);
      setError('Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePreApprove = async (id: string) => {
    setActionLoading(id)
    try {
      // Update the submission in Supabase to PENDING status
      const { error: updateError } = await supabase
        .from('guests')
        .update({
          status: GuestStatus.PENDING,
          pre_approved_by: user.id,
          pre_approved_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      // Send SMS notification to pending approver (in production)
      // await sendPreApprovedNotificationSMS(id)
      
      // Update local state
      setPendingPreApprovalSubmissions(prev => 
        prev.filter(sub => sub.id !== id)
      )
      
      // Close the active submission view
      setActiveSubmission(null)
      
      // Reload submissions to get updated data
      loadSubmissions()
    } catch (err) {
      console.error('Pre-approval error:', err)
      setError('Failed to pre-approve guest')
    } finally {
      setActionLoading(null)
    }
  }
  
  const handlePreApprovalDeny = async (id: string) => {
    setActionLoading(id)
    try {
      // Update the submission in Supabase
      const { error: updateError } = await supabase
        .from('guests')
        .update({
          status: GuestStatus.PRE_APPROVAL_DENIED,
          pre_approval_denied_by: user.id,
          pre_approval_denied_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      // Send SMS notification (in production)
      // await sendPreApprovalDenialSMS(id)
      
      // Update local state
      setPendingPreApprovalSubmissions(prev => 
        prev.filter(sub => sub.id !== id)
      )
      
      // Close the active submission view
      setActiveSubmission(null)
      
      // Reload submissions to get updated data
      loadSubmissions()
    } catch (err) {
      console.error('Pre-approval denial error:', err)
      setError('Failed to deny pre-approval for guest')
    } finally {
      setActionLoading(null)
    }
  }
  
  // Load completed submissions
  const loadCompletedSubmissions = async () => {
    try {
      // Query Supabase for completed submissions
      const { data, error: queryError } = await supabase
        .from('guests')
        .select(`
          *,
          guest_children (*)
        `)
        .in('status', [GuestStatus.APPROVED, GuestStatus.DENIED, GuestStatus.PRE_APPROVAL_DENIED])
        .order('updated_at', { ascending: false })
        .limit(20); // Limit to avoid loading too many

      if (queryError) {
        throw queryError;
      }

      if (!data) {
        setCompletedSubmissions([]);
        return;
      }

      // Transform data to match our component's expected format
      const formattedSubmissions: Submission[] = data.map(guest => formatGuestData(guest));
      
      setCompletedSubmissions(formattedSubmissions);
    } catch (err) {
      console.error('Error loading completed submissions:', err);
      // Don't set the error state as this is not critical
    }
  }

  // Helper function to format guest data into submission format
  const formatGuestData = (guest: any): Submission => {
    return {
      id: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name,
      email: guest.email || '',
      phone: guest.phone,
      visitDate: guest.visit_date,
      gatheringTime: guest.gathering_time,
      totalGuests: guest.total_guests,
      hasChildrenForFormationKids: guest.should_enroll_children,
      childrenInfo: guest.guest_children || [],
      carType: guest.vehicle_type,
      vehicleColor: guest.vehicle_color || '',
      vehicleMake: guest.vehicle_make || '',
      vehicleModel: guest.vehicle_model || '',
      foodAllergies: guest.food_allergies || '',
      specialNeeds: guest.special_needs || '',
      additionalNotes: guest.additional_notes || '',
      status: guest.status,
      profilePicture: guest.photo_path || '',
      submittedAt: guest.created_at,
      preApprovedBy: guest.pre_approved_by,
      preApprovedAt: guest.pre_approved_at,
      preApprovalDeniedBy: guest.pre_approval_denied_by,
      preApprovalDeniedAt: guest.pre_approval_denied_at,
      approvedBy: guest.approved_by,
      approvedAt: guest.approved_at,
      deniedBy: guest.denied_by,
      deniedAt: guest.denied_at
    };
  }

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      // Generate QR code value (just using the ID for this example)
      const qrCodeValue = `guest:${id}:${Date.now()}`
      
      // Generate a random code word from a list of easy-to-remember words
      const codeWords = ['APPLE', 'BANANA', 'CHERRY', 'DIAMOND', 'EAGLE', 'FALCON', 'GRAPE', 'HONEY']
      const randomCodeWord = codeWords[Math.floor(Math.random() * codeWords.length)]
      
      // Calculate QR code expiry (7 days from now)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7)
      
      // Update the submission in Supabase
      const { error: updateError } = await supabase
        .from('guests')
        .update({
          status: GuestStatus.APPROVED,
          qr_code: qrCodeValue,
          code_word: randomCodeWord,
          qr_expiry: expiryDate.toISOString(),
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      // Send SMS notification (in production)
      // await sendApprovalSMS(id)
      
      // Update local state
      setPendingSubmissions(prev => 
        prev.filter(sub => sub.id !== id)
      )
      
      // Close the active submission view
      setActiveSubmission(null)
      
      // Reload submissions to get updated data
      loadSubmissions()
    } catch (err) {
      console.error('Approval error:', err)
      setError('Failed to approve guest')
    } finally {
      setActionLoading(null)
    }
  }
  
  const handleDeny = async (id: string) => {
    setActionLoading(id)
    try {
      // Update the submission in Supabase
      const { error: updateError } = await supabase
        .from('guests')
        .update({
          status: GuestStatus.DENIED,
          denied_by: user.id,
          denied_at: new Date().toISOString()
        })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      // Send SMS notification (in production)
      // await sendDenialSMS(id)
      
      // Update local state
      setPendingSubmissions(prev => 
        prev.filter(sub => sub.id !== id)
      )
      
      // Close the active submission view
      setActiveSubmission(null)
      
      // Reload submissions to get updated data
      loadSubmissions()
    } catch (err) {
      console.error('Denial error:', err)
      setError('Failed to deny guest')
    } finally {
      setActionLoading(null)
    }
  }
  
  // Get formatted date from ISO string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  // Get relative time from ISO string
  const getRelativeTime = (dateString: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    
    // Convert to seconds, minutes, hours, days
    const diffSec = Math.round(diffMs / 1000)
    const diffMin = Math.round(diffSec / 60)
    const diffHour = Math.round(diffMin / 60)
    const diffDay = Math.round(diffHour / 24)
    
    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
    
    return formatDate(dateString)
  }
  
  // Get the profile picture URL
  const getProfilePicUrl = (profilePath: string) => {
    if (!profilePath) return ''
    
    // In production this would use Supabase storage URL
    return `https://oigtjjfydtbbttxxvywb.supabase.co/storage/v1/object/public/guest-photos/${profilePath}`
  }

  return (
    <div className="min-h-screen bg-white">
      <FloatingElements />
      
      {/* Top navigation bar */}
      <div className="bg-black text-white p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image 
              src="/church-logo.png"
              alt="Church Logo" 
              width={40}
              height={40}
              className="filter brightness-0 invert"
            />
            <h1 className="text-2xl font-bold">2819 Church Admin</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Badge className={`${systemStatus === 'online' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                System: {systemStatus === 'online' ? 'Online' : 'Offline'}
              </Badge>
              
              <Avatar>
                <AvatarFallback className="bg-red-600 text-white">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
                {user.user_metadata?.avatar_url && (
                  <AvatarImage src={user.user_metadata.avatar_url} />
                )}
              </Avatar>
              
              <span className="text-sm hidden md:inline-block">
                {user.email}
              </span>
            </div>
            
            <Button 
              variant="outline"
              size="sm"
              className="border-white text-white hover:bg-red-600"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header and controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Guest Registration Admin</h2>
            <p className="text-gray-600">
              Review and manage guest registration requests
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showCompleted"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="showCompleted" className="text-sm">
                Show Completed Requests
              </label>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={loadSubmissions}
                variant="outline"
                className="border-red-600 text-red-600"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={() => setDebugMode(!debugMode)}
                variant="outline"
                className="border-blue-600 text-blue-600"
              >
                <Bug className="w-4 h-4 mr-2" />
                {debugMode ? 'Hide Debug' : 'Debug'}
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
        
        {/* Debug Panel */}
        {debugMode && (
          <Card className="border-2 border-blue-300 bg-blue-50 mb-8">
            <CardHeader className="bg-blue-100 border-b border-blue-200">
              <CardTitle className="text-lg text-blue-800 flex items-center">
                <Bug className="w-5 h-5 mr-2" />
                Debug Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">User Information</h4>
                <pre className="bg-blue-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify({ 
                    id: user.id,
                    email: user.email,
                    app_metadata: user.app_metadata,
                    user_metadata: user.user_metadata,
                    roles: userRoles
                  }, null, 2)}
                </pre>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-blue-600 text-blue-600"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const result = await createTestGuest();
                      setTestResult(result);
                      if (result.success) {
                        setStatusMsg('Test guest created successfully!');
                        // Reload submissions to see the new test guest
                        await loadSubmissions();
                      } else {
                        setError(`Failed to create test guest: ${result.message}`);
                      }
                    } catch (err) {
                      console.error('Error creating test guest:', err);
                      setError('Error creating test guest');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Database className="w-4 h-4 mr-1" />
                  Create Test Guest
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-blue-600 text-blue-600"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const result = await testRlsPolicies(user.id);
                      setTestResult(result);
                      if (result.success) {
                        setStatusMsg('RLS policy test completed!');
                      } else {
                        setError(`Failed to test RLS policies: ${result.message}`);
                      }
                    } catch (err) {
                      console.error('Error testing RLS policies:', err);
                      setError('Error testing RLS policies');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <Bug className="w-4 h-4 mr-1" />
                  Test RLS Policies
                </Button>
              </div>
              
              {testResult && (
                <div>
                  <h4 className="font-medium mb-2">Test Result</h4>
                  <pre className="bg-blue-100 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
              
              <Alert className="bg-yellow-50 border border-yellow-300">
                <AlertDescription className="text-yellow-800 text-sm">
                  <p><strong>Debugging Tips:</strong></p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Open your browser console (F12 &gt; Console) to see detailed logs</li>
                    <li>Click "Create Test Guest" to add a test record with pending_pre_approval status</li>
                    <li>Click "Test RLS Policies" to verify if your user can access the records</li>
                    <li>After creating a test guest, click "Refresh" to see if it appears</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
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
              {/* Active submission view */}
              {activeSubmission && (
                <AnimatedSection>
                  <Card className="border-2 border-black shadow-xl mb-8">
                    <CardHeader className="bg-black text-white flex flex-row justify-between items-center">
                      <CardTitle className="text-2xl">Guest Details</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white text-white hover:bg-gray-800"
                        onClick={() => setActiveSubmission(null)}
                      >
                        Close
                      </Button>
                    </CardHeader>
                    <CardContent className="p-6">
                      {[...pendingPreApprovalSubmissions, ...pendingSubmissions, ...completedSubmissions].filter(sub => sub.id === activeSubmission).map(submission => (
                        <div key={submission.id} className="space-y-8">
                          {/* Guest header */}
                          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200">
                            <div className="flex items-center gap-4 mb-4 md:mb-0">
                              <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden">
                                {submission.profilePicture ? (
                                  <Image 
                                    src={getProfilePicUrl(submission.profilePicture)}
                                    alt={`${submission.firstName} ${submission.lastName}`}
                                    width={64}
                                    height={64}
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                                    No Img
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-black">
                                  {submission.firstName} {submission.lastName}
                                </h3>
                                <p className="text-gray-600">
                                  Submitted {getRelativeTime(submission.submittedAt)}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              {submission.status === GuestStatus.PENDING_PRE_APPROVAL && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <Button 
                                    onClick={() => handlePreApprove(submission.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    disabled={actionLoading === submission.id}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Pre-Approve
                                  </Button>
                                  <Button 
                                    onClick={() => handlePreApprovalDeny(submission.id)}
                                    variant="outline"
                                    className="border-red-600 text-red-600 hover:bg-red-50"
                                    disabled={actionLoading === submission.id}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Deny Pre-Approval
                                  </Button>
                                </div>
                              )}
                              {submission.status === GuestStatus.PENDING && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <Button 
                                    onClick={() => handleApprove(submission.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    disabled={actionLoading === submission.id}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve Guest
                                  </Button>
                                  <Button 
                                    onClick={() => handleDeny(submission.id)}
                                    variant="outline"
                                    className="border-red-600 text-red-600 hover:bg-red-50"
                                    disabled={actionLoading === submission.id}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Deny Guest
                                  </Button>
                                </div>
                              )}
                              {submission.status === GuestStatus.APPROVED && (
                                <Badge className="bg-green-600 text-white py-1 px-3 text-lg">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approved
                                </Badge>
                              )}
                              {submission.status === GuestStatus.DENIED && (
                                <Badge className="bg-red-600 text-white py-1 px-3 text-lg">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Denied
                                </Badge>
                              )}
                              {submission.status === GuestStatus.PRE_APPROVAL_DENIED && (
                                <Badge className="bg-red-600 text-white py-1 px-3 text-lg">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Pre-Approval Denied
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Pre-approval info */}
                          {submission.preApprovedBy && (
                            <div className="pb-6 border-b border-gray-200">
                              <h4 className="text-lg font-medium text-black mb-2">Pre-Approval Information</h4>
                              <p className="text-gray-600">
                                Pre-approved by: {submission.preApprovedBy}
                              </p>
                              {submission.preApprovedAt && (
                                <p className="text-gray-600">
                                  Pre-approved on: {formatDate(submission.preApprovedAt)}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Visit details */}
                          <div className="pb-6 border-b border-gray-200">
                            <h4 className="text-lg font-medium text-black mb-2 flex items-center">
                              <Calendar className="w-5 h-5 mr-2 text-red-600" />
                              Visit Details
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-gray-500 text-sm">Visit Date</p>
                                <p className="text-lg">{formatDate(submission.visitDate)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-sm">Gathering Time</p>
                                <p className="text-lg">{submission.gatheringTime}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-sm">Total Guests</p>
                                <p className="text-lg">{submission.totalGuests}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Contact details */}
                          <div className="pb-6 border-b border-gray-200">
                            <h4 className="text-lg font-medium text-black mb-2">Contact Information</h4>
                            
                            <div className="space-y-3">
                              <div className="flex items-start">
                                <Phone className="w-5 h-5 mr-3 text-gray-500" />
                                <div>
                                  <p className="text-gray-500 text-sm">Phone</p>
                                  <p className="text-lg">{submission.phone}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-start">
                                <Mail className="w-5 h-5 mr-3 text-gray-500" />
                                <div>
                                  <p className="text-gray-500 text-sm">Email</p>
                                  <p className="text-lg">{submission.email || "Not provided"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Vehicle info */}
                          <div className="pb-6 border-b border-gray-200">
                            <h4 className="text-lg font-medium text-black mb-2 flex items-center">
                              <Car className="w-5 h-5 mr-2 text-red-600" />
                              Vehicle Information
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-gray-500 text-sm">Type</p>
                                <p className="text-lg">{submission.carType}</p>
                              </div>
                              {submission.vehicleMake && (
                                <div>
                                  <p className="text-gray-500 text-sm">Make</p>
                                  <p className="text-lg">{submission.vehicleMake}</p>
                                </div>
                              )}
                              {submission.vehicleModel && (
                                <div>
                                  <p className="text-gray-500 text-sm">Model</p>
                                  <p className="text-lg">{submission.vehicleModel}</p>
                                </div>
                              )}
                              {submission.vehicleColor && (
                                <div>
                                  <p className="text-gray-500 text-sm">Color</p>
                                  <p className="text-lg">{submission.vehicleColor}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Children */}
                          {submission.hasChildrenForFormationKids && (
                            <div className="pb-6 border-b border-gray-200">
                              <h4 className="text-lg font-medium text-black mb-2 flex items-center">
                                <Baby className="w-5 h-5 mr-2 text-red-600" />
                                Children for Formation Kids
                              </h4>
                              
                              {submission.childrenInfo.length > 0 ? (
                                <div className="space-y-4">
                                  {submission.childrenInfo.map((child, index) => (
                                    <Card key={index} className="bg-gray-50 p-4 border border-gray-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-gray-500 text-sm">Name</p>
                                          <p className="text-lg font-medium">{child.name}</p>
                                        </div>
                                        {child.dob && (
                                          <div>
                                            <p className="text-gray-500 text-sm">Date of Birth</p>
                                            <p className="text-lg">{formatDate(child.dob)}</p>
                                          </div>
                                        )}
                                        {child.allergies && (
                                          <div className="md:col-span-2">
                                            <p className="text-gray-500 text-sm">Allergies/Special Needs</p>
                                            <p className="text-lg">{child.allergies}</p>
                                          </div>
                                        )}
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-600">No children information provided</p>
                              )}
                            </div>
                          )}
                          
                          {/* Additional info */}
                          <div className="space-y-6">
                            <h4 className="text-lg font-medium text-black mb-2 flex items-center">
                              <MessageSquare className="w-5 h-5 mr-2 text-red-600" />
                              Additional Information
                            </h4>
                            
                            {(submission.foodAllergies || submission.specialNeeds || submission.additionalNotes) ? (
                              <div className="space-y-4">
                                {submission.foodAllergies && (
                                  <div>
                                    <p className="text-gray-500 text-sm">Food Allergies</p>
                                    <p className="text-lg bg-gray-50 p-3 border border-gray-200 rounded-md">
                                      {submission.foodAllergies}
                                    </p>
                                  </div>
                                )}
                                
                                {submission.specialNeeds && (
                                  <div>
                                    <p className="text-gray-500 text-sm">Special Needs</p>
                                    <p className="text-lg bg-gray-50 p-3 border border-gray-200 rounded-md">
                                      {submission.specialNeeds}
                                    </p>
                                  </div>
                                )}
                                
                                {submission.additionalNotes && (
                                  <div>
                                    <p className="text-gray-500 text-sm">Additional Notes</p>
                                    <p className="text-lg bg-gray-50 p-3 border border-gray-200 rounded-md">
                                      {submission.additionalNotes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-600">No additional information provided</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </AnimatedSection>
              )}
            
              {/* Pending Pre-Approval Submissions */}
              {userRoles.isPreApprover && (
                <div className="mb-8">
                  {pendingPreApprovalSubmissions.length === 0 ? (
                    <Card className="border-2 border-gray-200 shadow-md">
                      <CardContent className="p-8 text-center">
                        <div className="max-w-md mx-auto">
                          <p className="text-xl text-gray-600 mb-4">
                            No pending pre-approval submissions found.
                          </p>
                          <Button
                            onClick={loadSubmissions}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh List
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-2 border-gray-200 shadow-md">
                      <CardHeader className="bg-yellow-50 border-b-2 border-yellow-200">
                        <CardTitle className="text-xl text-yellow-800">Pending Pre-Approval Guests</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 divide-y divide-gray-200">
                        {pendingPreApprovalSubmissions.map(submission => (
                          <div 
                            key={submission.id}
                            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setActiveSubmission(submission.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                                  {submission.profilePicture ? (
                                    <Image 
                                      src={getProfilePicUrl(submission.profilePicture)}
                                      alt={`${submission.firstName} ${submission.lastName}`}
                                      width={48}
                                      height={48}
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                                      No Img
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium">{submission.firstName} {submission.lastName}</h4>
                                  <p className="text-sm text-gray-600">
                                    Visiting on {formatDate(submission.visitDate)} • {submission.totalGuests} guest{submission.totalGuests > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <p className="text-sm text-gray-600 hidden md:block">{getRelativeTime(submission.submittedAt)}</p>
                                
                                <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pre-Approval
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              
              {/* Pending Submissions */}
              {userRoles.isPendingApprover && (
                <div className="mb-8">
                  {pendingSubmissions.length === 0 ? (
                    <Card className="border-2 border-gray-200 shadow-md">
                      <CardContent className="p-8 text-center">
                        <div className="max-w-md mx-auto">
                          <p className="text-xl text-gray-600 mb-4">
                            No pending submissions found.
                          </p>
                          <Button
                            onClick={loadSubmissions}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh List
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-2 border-gray-200 shadow-md">
                      <CardHeader className="bg-blue-50 border-b-2 border-blue-200">
                        <CardTitle className="text-xl text-blue-800">Pending Guests</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 divide-y divide-gray-200">
                        {pendingSubmissions.map(submission => (
                          <div 
                            key={submission.id}
                            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setActiveSubmission(submission.id)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                                  {submission.profilePicture ? (
                                    <Image 
                                      src={getProfilePicUrl(submission.profilePicture)}
                                      alt={`${submission.firstName} ${submission.lastName}`}
                                      width={48}
                                      height={48}
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                                      No Img
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium">{submission.firstName} {submission.lastName}</h4>
                                  <p className="text-sm text-gray-600">
                                    Visiting on {formatDate(submission.visitDate)} • {submission.totalGuests} guest{submission.totalGuests > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <p className="text-sm text-gray-600 hidden md:block">{getRelativeTime(submission.submittedAt)}</p>
                                
                                <Badge className="bg-blue-50 text-blue-800 border border-blue-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
              
              {/* Completed Submissions (if enabled) */}
              {showCompleted && completedSubmissions.length > 0 && (
                <Card className="border-2 border-gray-200 shadow-md">
                  <CardHeader className="bg-gray-100">
                    <CardTitle className="text-xl">Completed Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-gray-200">
                    {completedSubmissions.map(submission => (
                      <div 
                        key={submission.id}
                        className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setActiveSubmission(submission.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                              {submission.profilePicture ? (
                                <Image 
                                  src={getProfilePicUrl(submission.profilePicture)}
                                  alt={`${submission.firstName} ${submission.lastName}`}
                                  width={48}
                                  height={48}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                                  No Img
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-lg font-medium">{submission.firstName} {submission.lastName}</h4>
                              <p className="text-sm text-gray-600">
                                Visiting on {formatDate(submission.visitDate)} • {submission.totalGuests} guest{submission.totalGuests > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-gray-600 hidden md:block">{getRelativeTime(submission.submittedAt)}</p>
                            
                            {submission.status === GuestStatus.APPROVED && (
                              <Badge className="bg-green-50 text-green-800 border border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                            
                            {submission.status === GuestStatus.DENIED && (
                              <Badge className="bg-red-50 text-red-800 border border-red-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Denied
                              </Badge>
                            )}
                            
                            {submission.status === GuestStatus.PRE_APPROVAL_DENIED && (
                              <Badge className="bg-red-50 text-red-800 border border-red-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Pre-Approval Denied
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
