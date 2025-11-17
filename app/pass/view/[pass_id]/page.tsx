'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Calendar, Clock, QrCode, Key } from 'lucide-react'
import { AnimatedSection } from '@/components/AnimatedSection'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import { getGuestCredentials } from '@/lib/guest-credentials'
import Image from 'next/image'
import { formatTimestamp, formatVisitDate } from '@/lib/date-timezone-utils'

interface GuestPassData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  visitDate: string
  gatheringTime: string
  totalGuests: number
  qrCode: string
  codeWord: string
  qrExpiry: string
}

export default function GuestPassPage() {
  const params = useParams()
  const passId = params.pass_id as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guestData, setGuestData] = useState<GuestPassData | null>(null)

  useEffect(() => {
    const fetchGuestPass = async () => {
      if (!passId) {
        setError('Missing pass ID')
        setLoading(false)
        return
      }

      try {
        const result = await getGuestCredentials(passId)
        
        if (!result.success) {
          setError(result.message || 'Failed to retrieve guest pass')
        } else if (result.data) {
          setGuestData(result.data)
        } else {
          setError('No guest data found')
        }
      } catch (err) {
        setError('An error occurred while retrieving your guest pass')
      } finally {
        setLoading(false)
      }
    }

    fetchGuestPass()
  }, [passId])

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    
    // Simple visit date formatting
    return formatVisitDate(dateString, {
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timestampString: string) => {
    return formatTimestamp(timestampString, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <AnimatedSection className="w-full max-w-md">
          <Card className="border-2 border-black shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-8 animate-spin" />
              <p className="text-xl text-black">Loading your guest pass...</p>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    )
  }

  if (error || !guestData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <AnimatedSection className="w-full max-w-md">
          <Card className="border-2 border-red-600 shadow-2xl">
            <CardHeader className="text-center bg-red-600 text-white">
              <div className="relative h-20 w-auto mx-auto mb-6">
                <Image 
                  src="/church-logo.png"
                  alt="Church Logo" 
                  fill
                  style={{ objectFit: 'contain' }}
                  className="filter brightness-0 invert"
                />
              </div>
              <CardTitle className="text-2xl">Invalid Pass</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6 p-8">
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-red-600" />
              </div>
              <p className="text-xl text-red-800">
                {error || 'Your guest pass could not be found or has expired.'}
              </p>
              <Badge variant="destructive" className="text-lg px-4 py-2">
                Invalid Pass
              </Badge>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 relative">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-12">
          <div className="relative h-24 w-full mx-auto mb-6">
            <Image 
              src="/church-logo.png"
              alt="Church Logo" 
              width={96}
              height={96}
              style={{ objectFit: 'contain', margin: '0 auto' }}
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">Your Guest Pass</h1>
          <p className="text-xl text-gray-600">2819 Church</p>
        </AnimatedSection>

        <AnimatedSection delay={0.3}>
          <Card className="border-2 border-green-600 shadow-2xl">
            <CardHeader className="bg-green-600 text-white text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12" />
              </div>
              <CardTitle className="text-2xl">Welcome, {guestData.firstName}!</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* Guest Info */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-black mb-4">
                    {guestData.firstName} {guestData.lastName}
                  </h3>
                  <Badge className="bg-green-600 text-white py-2 px-4 text-lg mb-6">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approved Guest
                  </Badge>
                </div>

                {/* Visit Details */}
                <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                  <h4 className="text-xl font-semibold text-black mb-4 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-green-600" />
                    Visit Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Date</p>
                      <p className="text-lg font-medium">{formatDate(guestData.visitDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Time</p>
                      <p className="text-lg font-medium">{guestData.gatheringTime}</p>
                    </div>
                  </div>
                </div>

                {/* Code Word */}
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 text-center">
                  <h4 className="text-xl font-semibold text-black mb-4 flex items-center justify-center">
                    <Key className="w-6 h-6 mr-2 text-blue-600" />
                    Your Code Word
                  </h4>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {guestData.codeWord}
                  </div>
                  <p className="text-gray-600">Present this code word when you arrive</p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-6 rounded-lg border-2 border-gray-200 text-center">
                  <h4 className="text-xl font-semibold text-black mb-4 flex items-center justify-center">
                    <QrCode className="w-6 h-6 mr-2 text-gray-600" />
                    Your QR Code
                  </h4>
                  
                  <QRCodeDisplay 
                    value={guestData.qrCode} 
                    size={200}
                    className="mx-auto mb-4"
                    guestInfo={{
                      firstName: guestData.firstName,
                      lastName: guestData.lastName
                    }}
                    showDirections={true}
                  />
                  
                  <p className="text-gray-600">Show this QR code at check-in</p>
                </div>

                {/* Expiry Info */}
                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                    <span className="font-semibold">Pass Valid Until</span>
                  </div>
                  <p className="text-lg">{formatTime(guestData.qrExpiry)}</p>
                </div>

                {/* Instructions */}
                <div className="text-center text-gray-600">
                  <p className="mb-2">Please arrive on time and present either your code word or QR code.</p>
                  <p>We look forward to welcoming you to 2819 Church!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  )
}
