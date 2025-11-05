'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Search } from 'lucide-react'
import { PassDetailsDisplay } from '@/components/PassDetailsDisplay'
import { verifyGuestPass, markPassAsUsed, PassVerificationResult } from '@/lib/pass-verification'
import { FloatingElements } from '@/components/FloatingElements'
import Image from 'next/image'

export default function AdminVerificationWithPassIdPage() {
  const params = useParams()
  const passId = params.pass_id as string
  
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verificationResult, setVerificationResult] = useState<PassVerificationResult | null>(null)
  const [isMarkingAttended, setIsMarkingAttended] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientComponentClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin?redirect=' + encodeURIComponent(`/admin/verification/${passId}`))
        return
      }
      
      setUser(session.user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  // Auto-verify the pass_id when component loads
  useEffect(() => {
    if (user && passId) {
      handleVerifyPass(passId)
    }
  }, [user, passId])

  const handleVerifyPass = async (targetPassId: string) => {
    if (!targetPassId?.trim()) {
      setError('Invalid pass ID')
      return
    }

    setError('')
    
    try {
      const result = await verifyGuestPass(targetPassId.trim())
      setVerificationResult(result)
      
      if (!result.success) {
        setError(result.message || 'Pass verification failed')
      }
    } catch (err) {
      setError('Failed to verify pass')
    }
  }


  const handleMarkAttended = async () => {
    if (!user?.email || !verificationResult?.guest?.id) return

    setIsMarkingAttended(true)
    
    try {
      const result = await markPassAsUsed(verificationResult.guest.id, user.email)
      
      if (result.success) {
        // Refresh verification result to show updated status
        if (passId) {
          const updatedResult = await verifyGuestPass(passId)
          setVerificationResult(updatedResult)
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to mark as attended')
    } finally {
      setIsMarkingAttended(false)
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
    <div className="min-h-screen bg-white">
      <FloatingElements />
      
      {/* Header */}
      <div className="bg-black text-white p-6">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="border-white text-white hover:bg-gray-800"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          
          <div className="flex items-center gap-4">
            <Image 
              src="/church-logo.png"
              alt="Church Logo" 
              width={40}
              height={40}
              className="filter brightness-0 invert"
            />
            <h1 className="text-2xl font-bold">Pass Verification</h1>
          </div>
          
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="border-white text-white hover:bg-gray-800"
              onClick={() => router.push('/admin/verification')}
            >
              <Search className="w-4 h-4 mr-2" />
              Manual Search
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Pass ID Info */}
        <Card className="border-2 border-gray-200 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Verifying Pass ID: {passId}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {verificationResult ? 
                (verificationResult.success ? 'Pass verification completed' : 'Pass ID not found - try searching by code word below') :
                'Checking pass validity...'
              }
            </p>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="border-2 border-red-600 bg-red-50 mb-8">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}


        {/* Verification Results */}
        {verificationResult && (
          <PassDetailsDisplay
            verificationResult={verificationResult}
            onMarkAttended={handleMarkAttended}
            isMarkingAttended={isMarkingAttended}
          />
        )}

        {/* Instructions */}
        {!verificationResult && (
          <Card className="border-2 border-gray-200 shadow-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold mb-4">Verifying Pass...</h3>
              <p className="text-gray-600">
                Checking the validity of pass ID: <code className="bg-gray-100 px-2 py-1 rounded">{passId}</code>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
