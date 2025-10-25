import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { QRCodeDisplay } from './QRCodeDisplay'
import { CheckCircle, XCircle, Clock, Search, RefreshCw, Calendar, Users, Car } from 'lucide-react'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { FloatingElements } from './FloatingElements'
import { motion } from 'motion/react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import churchLogo from 'figma:asset/8a0d7e407ac0e2cb1219f412ca5d6c6eb8ea3b1c.png'

interface Submission {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  visitDate: string
  gatheringTime: string
  totalGuests: number
  carType: string
  status: 'pending' | 'approved' | 'denied'
  submittedAt: string
  qrCode?: string
  qrExpiry?: string
  codeWord?: string
}

export function StatusCheck() {
  const [submissionId, setSubmissionId] = useState('')
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationLoading, setVerificationLoading] = useState(false)

  // Check URL for submission ID and prompt for verification
  useEffect(() => {
    const urlPath = window.location.pathname
    const match = urlPath.match(/\/status\/(.+)/)
    if (match && match[1]) {
      const urlSubmissionId = decodeURIComponent(match[1])
      setSubmissionId(urlSubmissionId)
      setNeedsPhoneVerification(true) // Require phone verification for direct links
    }
  }, [])

  // Auto-refresh for approved submissions every 30 seconds
  useEffect(() => {
    if (submission && submission.status === 'approved') {
      const interval = setInterval(() => checkStatus(submissionId), 30000)
      return () => clearInterval(interval)
    }
  }, [submission, submissionId])

  const checkStatus = async (id?: string) => {
    const idToCheck = id || submissionId
    if (!idToCheck.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-66bf82e5/status/${idToCheck}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status')
      }

      setSubmission(data.submission)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status')
      setSubmission(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkStatus()
  }

  const handlePhoneVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber.trim()) return

    setVerificationLoading(true)
    setError('')

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-66bf82e5/verify-phone/${submissionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Phone verification failed')
      }

      setSubmission(data.submission)
      setNeedsPhoneVerification(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phone verification failed')
    } finally {
      setVerificationLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'denied': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'denied': return <XCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Phone verification form (shown for direct links)
  if (needsPhoneVerification && !submission) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 relative">
        <FloatingElements />
        <div className="max-w-md mx-auto">
          <AnimatedSection className="text-center mb-8">
            <motion.img 
              src={churchLogo} 
              alt="2819 Church Logo" 
              className="h-20 w-auto mx-auto mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <h1 className="text-4xl font-bold text-black mb-2">2819 CHURCH</h1>
            <h2 className="text-xl text-gray-600">Phone Verification Required</h2>
          </AnimatedSection>

          <Card className="border-2 border-black shadow-2xl">
            <CardHeader className="bg-black text-white">
              <CardTitle className="text-xl">Verify Your Identity</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-6">
                To protect your privacy, please enter the phone number associated with this registration.
              </p>
              
              <form onSubmit={handlePhoneVerification} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                    className="border-2 border-gray-300 focus:border-red-600"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={verificationLoading || !phoneNumber.trim()}
                >
                  {verificationLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block mr-2"
                      >
                        ⟳
                      </motion.div>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Footer for phone verification */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              2819 Church Guest Registration System
            </p>
            <p className="text-sm text-red-600 mt-2 font-medium">
              Sharing this private link is prohibited and can prevent guests from being accepted in the future.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 relative">
      <FloatingElements />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-12">
          <motion.img 
            src={churchLogo} 
            alt="2819 Church Logo" 
            className="h-24 w-auto mx-auto mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <AnimatedText 
            text="2819 CHURCH"
            className="text-6xl font-bold text-black mb-4"
          />
          <AnimatedText 
            text="Check Registration Status"
            className="text-2xl text-gray-600"
            delay={0.5}
          />
        </AnimatedSection>

        {/* Search Form */}
        <AnimatedSection delay={0.3} className="mb-10">
          <Card className="border-2 border-black shadow-2xl">
            <CardHeader className="bg-black text-white">
              <AnimatedText 
                text="Status Lookup"
                className="text-3xl font-bold flex items-center gap-3"
              />
              <Search className="h-8 w-8 text-red-600" />
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="submissionId" className="text-xl">Submission ID</Label>
                  <Input
                    id="submissionId"
                    value={submissionId}
                    onChange={(e) => setSubmissionId(e.target.value)}
                    placeholder="Enter your submission ID (e.g., submission_123456789_abc123)"
                    required
                    className="border-2 border-gray-300 focus:border-red-600 py-4"
                  />
                  <p className="text-lg text-gray-500">
                    You received this ID when you submitted your registration
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    type="submit" 
                    className="w-full bg-red-600 hover:bg-red-700 text-xl py-6"
                    disabled={loading || !submissionId.trim()}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block mr-3"
                        >
                          ⟳
                        </motion.div>
                        Checking...
                      </>
                    ) : (
                      <>
                        <Search className="h-6 w-6 mr-3" />
                        Check Status
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Results */}
        {submission && (
          <div className="space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Registration Status</span>
                  <Badge className={getStatusColor(submission.status)}>
                    {getStatusIcon(submission.status)}
                    <span className="ml-1 capitalize">{submission.status}</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Guest Name</p>
                    <p className="font-medium">{submission.firstName} {submission.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{submission.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Visit Date</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(submission.visitDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gathering Time</p>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {submission.gatheringTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Guests</p>
                    <p className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {submission.totalGuests}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-medium flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      {submission.carType}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status-specific content */}
            {submission.status === 'pending' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  <strong>Your registration is being reviewed.</strong>
                  <br />
                  You will receive an email and SMS notification once a decision is made. Please check back later or wait for your notification.
                </AlertDescription>
              </Alert>
            )}

            {submission.status === 'denied' && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <strong>Unfortunately, your registration was not approved at this time.</strong>
                  <br />
                  If you have questions, please contact our church office for more information.
                </AlertDescription>
              </Alert>
            )}

            {submission.status === 'approved' && (
              <div className="space-y-6">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-800">
                    <strong>Congratulations! Your registration has been approved.</strong>
                    <br />
                    Please save your QR code and code word below. You'll need to present one of them when you arrive.
                  </AlertDescription>
                </Alert>

                {/* QR Code and Code Word */}
                {submission.qrCode && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Your Access Information</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => checkStatus(submission.id)}
                        disabled={loading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* QR Code */}
                      <div className="text-center">
                        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 inline-block mb-4">
                          <QRCodeDisplay 
                            value={submission.qrCode} 
                            size={250}
                            className="mx-auto"
                            guestInfo={{
                              firstName: submission.firstName,
                              lastName: submission.lastName
                            }}
                            showDirections={true}
                          />
                        </div>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">QR Code Text:</p>
                          <p className="font-mono text-lg font-bold">{submission.qrCode}</p>
                        </div>
                      </div>

                      {/* Code Word */}
                      {submission.codeWord && (
                        <div className="text-center">
                          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Weekly Code Word:</p>
                            <p className="text-3xl font-bold text-red-600">{submission.codeWord}</p>
                          </div>
                        </div>
                      )}

                      {/* Usage Info */}
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Important:</strong> Your access expires every Monday at 9:00 AM and you'll need to be re-approved for future visits.
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>How to use:</strong> Present either your QR code (show this screen) or tell the greeter your code word when you arrive at the church.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            2819 Church Guest Registration System
          </p>
          <p className="text-sm text-red-600 mt-2 font-medium">
            Sharing this private link is prohibited and can prevent guests from being accepted in the future.
          </p>
          <Button 
            variant="link" 
            onClick={() => window.location.href = '/'}
            className="text-sm text-gray-600 hover:text-black"
          >
            ← Back to Registration
          </Button>
        </div>
      </div>
    </div>
  )
}