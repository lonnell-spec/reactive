'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import { getGuestCredentials } from '@/lib/guest-credentials'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AnimatedSection } from '@/components/AnimatedSection'
import { FloatingElements } from '@/components/FloatingElements'
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Separate component to handle URL parameters with Suspense
function CredentialParamsHandler({ onCredentialParam }: { onCredentialParam: (credential: string | null) => void }) {
  // Import useSearchParams inside the component that's wrapped with Suspense
  const { useSearchParams } = require('next/navigation')
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const credential = searchParams.get('credential')
    onCredentialParam(credential)
  }, [searchParams, onCredentialParam])
  
  return null // This component doesn't render anything
}

export default function GuestCredentialsPage() {
  const [credentialId, setCredentialId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guestData, setGuestData] = useState<any>(null)
  const [paramsLoaded, setParamsLoaded] = useState(false)
  
  // Callback to handle the credential param from the Suspense-wrapped component
  const handleCredentialParam = (credential: string | null) => {
    setCredentialId(credential)
    setParamsLoaded(true)
  }
  
  useEffect(() => {
    // Only fetch data once we have the credential ID from URL params
    if (!paramsLoaded) return
    
    async function fetchGuestCredentials() {
      if (!credentialId) {
        setError('Missing credential parameter')
        setLoading(false)
        return
      }
      
      try {
        const result = await getGuestCredentials(credentialId)
        
        if (!result.success) {
          setError(result.message || 'Failed to retrieve guest credentials')
        } else {
          setGuestData(result.data)
        }
      } catch (err) {
        setError('An error occurred while retrieving your guest pass')
      } finally {
        setLoading(false)
      }
    }
    
    fetchGuestCredentials()
  }, [credentialId, paramsLoaded])
  
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      {/* Wrap the component that uses useSearchParams in Suspense */}
      <Suspense fallback={null}>
        <CredentialParamsHandler onCredentialParam={handleCredentialParam} />
      </Suspense>
      
      <FloatingElements />
      
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <AnimatedSection delay={0.1}>
          <div className="flex flex-col items-center text-center mb-8">
            <Image 
              src="/church-logo.png"
              alt="2819 Church Logo" 
              width={80}
              height={80}
              className="mb-4"
            />
            <h1 className="text-4xl font-bold text-black mb-2">Your Guest Pass</h1>
            <p className="text-gray-600 max-w-lg">
              Present this QR code when you arrive at 2819 Church
            </p>
          </div>
        </AnimatedSection>
        
        {/* Loading State */}
        {(loading || !paramsLoaded) && (
          <AnimatedSection>
            <Card className="border-2 border-gray-200 shadow-md">
              <CardContent className="p-8 flex justify-center items-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
                  <p className="text-xl">Loading your guest pass...</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}
        
        {/* Error State */}
        {!loading && paramsLoaded && error && (
          <AnimatedSection>
            <Alert className="border-2 border-red-600 bg-red-50 mb-8">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            
            <div className="text-center mt-8">
              <Link href="/">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        )}
        
        {/* QR Code Display */}
        {!loading && paramsLoaded && !error && guestData && (
          <AnimatedSection>
            <Card className="border-2 border-black shadow-xl overflow-hidden">
              <CardHeader className="bg-black text-white">
                <CardTitle className="text-2xl">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
                    Approved Guest Pass
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-black mb-1">
                      {guestData.firstName} {guestData.lastName}
                    </h2>
                    <p className="text-gray-600">
                      Visiting on {new Date(guestData.visitDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-600">
                      {guestData.gatheringTime} • {guestData.totalGuests} {guestData.totalGuests > 1 ? 'guests' : 'guest'}
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md border-2 border-gray-200 mb-6">
                    <div className="text-center mb-4">
                      <p className="font-bold text-lg">Your Code Word</p>
                      <p className="text-3xl font-bold text-red-600">{guestData.codeWord}</p>
                    </div>
                    
                    <QRCodeDisplay 
                      value={guestData.qrCode} 
                      size={200}
                      className="mx-auto"
                      guestInfo={{
                        firstName: guestData.firstName,
                        lastName: guestData.lastName
                      }}
                      showDirections={true}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-4">
                    <p>This pass expires on {new Date(guestData.qrExpiry).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}
      </div>
    </div>
  )
}