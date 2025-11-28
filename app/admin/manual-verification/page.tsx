'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { PassDetailsDisplay } from '@/components/PassDetailsDisplay'
import { markPassAsUsed, searchGuestByCodeWord, searchGuestByPhone, PassVerificationResult } from '@/lib/pass-verification'
import { AdminMenu } from '@/components/AdminMenu'
import Image from 'next/image'

export default function AdminManualVerificationPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [passId, setPassId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'code_word' | 'phone'>('code_word')
  const [verificationResult, setVerificationResult] = useState<PassVerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isMarkingAttended, setIsMarkingAttended] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientComponentClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/admin?redirect=' + encodeURIComponent('/admin/manual-verification'))
        return
      }
      
      setUser(session.user)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSearch = async () => {
    const term = searchTerm.trim()
    
    if (!term) {
      setError(`Please enter a ${searchType === 'code_word' ? 'code word' : 'phone number'}`)
      return
    }

    setIsVerifying(true)
    setError('')
    
    try {
      let result: PassVerificationResult
      
      if (searchType === 'code_word') {
        result = await searchGuestByCodeWord(term)
      } else {
        result = await searchGuestByPhone(term)
      }
      
      setVerificationResult(result)
    } catch (err) {
      setError(`Failed to search by ${searchType}`)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleMarkAttended = async () => {
    if (!user?.email || !verificationResult?.guest?.id) return

    setIsMarkingAttended(true)
    
    try {
      const result = await markPassAsUsed(verificationResult.guest.id, user.email)
      
      if (result.success) {
        // Refresh verification result to show updated status
        const term = searchTerm.trim()
        let updatedResult: PassVerificationResult
        
        if (searchType === 'code_word') {
          updatedResult = await searchGuestByCodeWord(term)
        } else {
          updatedResult = await searchGuestByPhone(term)
        }
        
        setVerificationResult(updatedResult)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Failed to mark as attended')
    } finally {
      setIsMarkingAttended(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
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
        <div className="max-w-4xl mx-auto">
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
              <h1 className="text-lg sm:text-2xl font-bold text-center sm:text-left">Pass Verification - Manual Search</h1>
            </div>
            
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Admin Menu */}
        <AdminMenu currentPath="/admin/manual-verification" />

        {/* Search Section */}
        <Card className="border-2 border-gray-200 shadow-md mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Search for Guest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Type Selector */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant={searchType === 'code_word' ? 'default' : 'outline'}
                onClick={() => setSearchType('code_word')}
                size="sm"
                className={`w-full sm:w-auto ${searchType === 'code_word' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                Code Word
              </Button>
              <Button
                variant={searchType === 'phone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchType('phone')}
                className={`w-full sm:w-auto ${searchType === 'phone' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                Phone Number
              </Button>
            </div>

            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={
                    searchType === 'code_word' 
                      ? "Enter code word (e.g., happy-elephant)" 
                      : "Enter phone number (e.g., 555-123-4567)"
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-base sm:text-lg"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isVerifying || (!passId.trim() && !searchTerm.trim())}
                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto sm:px-8"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {/* {error && (
          <Alert className="border-2 border-red-600 bg-red-50 mb-8">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )} */}

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
            <CardContent className="p-4 sm:p-8 text-center">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">How to Search for Guests</h3>
              <div className="text-gray-600 space-y-2 text-sm sm:text-base">
                <p><strong>Code Word:</strong> Enter their unique code word (e.g., "happy-elephant")</p>
                <p><strong>Phone Number:</strong> Enter their phone number in any format</p>
                <p className="mt-4 text-xs sm:text-sm">Once found, you can mark the guest as attended if their pass is valid.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

