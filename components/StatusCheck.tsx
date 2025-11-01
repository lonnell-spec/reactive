'use client'

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
import Image from 'next/image'
import { checkGuestStatus } from '@/lib/guest-status'
import { GuestStatus } from '@/lib/types'

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
  status: string
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
  const [verificationSuccess, setVerificationSuccess] = useState(false)

  // Extract submissionId from URL if present
  useEffect(() => {
    const url = new URL(window.location.href)
    const id = url.pathname.split('/').pop() || url.searchParams.get('id')
    if (id) {
      setSubmissionId(id)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!submissionId) {
      setError('Please enter a submission ID')
      return
    }
    
    setLoading(true)
    setNeedsPhoneVerification(true)
  }
  
  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!phoneNumber) {
      setError('Please enter your phone number')
      return
    }
    
    setLoading(true)
    
    try {
      const result = await checkGuestStatus(submissionId, phoneNumber)
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to verify submission')
      }
      
      setVerificationSuccess(true)
      setSubmission({
        id: result.guest.id,
        firstName: result.guest.first_name,
        lastName: result.guest.last_name,
        email: result.guest.email,
        phone: result.guest.phone,
        visitDate: result.guest.visit_date,
        gatheringTime: result.guest.gathering_time,
        totalGuests: result.guest.total_guests,
        carType: result.guest.vehicle_type,
        status: result.guest.status,
        submittedAt: result.guest.created_at,
        qrCode: result.guest.qr_code,
        qrExpiry: result.guest.qr_expiry,
        codeWord: result.guest.code_word,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case GuestStatus.APPROVED:
        return (
          <Badge className="bg-green-600 text-white py-1 px-3 text-lg">
            <CheckCircle className="w-4 h-4 mr-1" />
            Approved
          </Badge>
        )
      case GuestStatus.DENIED:
        return (
          <Badge className="bg-red-600 text-white py-1 px-3 text-lg">
            <XCircle className="w-4 h-4 mr-1" />
            Denied
          </Badge>
        )
      case GuestStatus.PENDING_PRE_APPROVAL:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 py-1 px-3 text-lg">
            <Clock className="w-4 h-4 mr-1" />
            Pending Pre-Approval
          </Badge>
        )
      case GuestStatus.PRE_APPROVAL_DENIED:
        return (
          <Badge className="bg-red-600 text-white py-1 px-3 text-lg">
            <XCircle className="w-4 h-4 mr-1" />
            Pre-Approval Denied
          </Badge>
        )
      case GuestStatus.PENDING:
      default:
        return (
          <Badge className="bg-blue-50 text-blue-800 border-blue-200 py-1 px-3 text-lg">
            <Clock className="w-4 h-4 mr-1" />
            Pending Approval
          </Badge>
        )
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case GuestStatus.APPROVED:
        return (
          <div className="space-y-4">
            <p className="text-green-800 text-xl">
              <CheckCircle className="w-6 h-6 inline-block mr-2 text-green-600" />
              Your guest registration has been approved!
            </p>
            <p className="text-black">
              Please use the QR code below for entry on your visit date. You may also receive this QR code via SMS if you provided a valid phone number.
            </p>
            {submission?.codeWord && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                <p className="text-green-800 font-medium mb-1">Your entry code word is:</p>
                <p className="text-3xl font-bold text-green-700">{submission.codeWord}</p>
              </div>
            )}
          </div>
        )
      case GuestStatus.DENIED:
        return (
          <div className="space-y-4">
            <p className="text-red-800 text-xl">
              <XCircle className="w-6 h-6 inline-block mr-2 text-red-600" />
              Your guest registration has been denied.
            </p>
            <p className="text-black">
              We're unable to approve your guest registration request at this time. If you believe this is in error or have any questions, please contact our church office.
            </p>
          </div>
        )
      case GuestStatus.PENDING_PRE_APPROVAL:
        return (
          <div className="space-y-4">
            <p className="text-yellow-800 text-xl">
              <Clock className="w-6 h-6 inline-block mr-2 text-yellow-800" />
              Your guest registration is awaiting initial review.
            </p>
            <p className="text-black">
              Your submission is being reviewed by our pastoral team. You will receive a notification once it has been pre-approved and sent to the admin team for final review.
            </p>
          </div>
        )
      case GuestStatus.PRE_APPROVAL_DENIED:
        return (
          <div className="space-y-4">
            <p className="text-red-800 text-xl">
              <XCircle className="w-6 h-6 inline-block mr-2 text-red-600" />
              Your guest registration was not pre-approved.
            </p>
            <p className="text-black">
              We're unable to approve your guest registration request at this time. If you believe this is in error or have any questions, please contact our church office.
            </p>
          </div>
        )
      case GuestStatus.PENDING:
      default:
        return (
          <div className="space-y-4">
            <p className="text-blue-800 text-xl">
              <Clock className="w-6 h-6 inline-block mr-2 text-blue-800" />
              Your guest registration is pending approval.
            </p>
            <p className="text-black">
              Your submission has been pre-approved and is now being reviewed by our admin team. You will receive a notification once it has been fully approved, including a QR code for entry.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <FloatingElements />
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-12">
          <motion.div 
            className="relative h-24 w-full mx-auto mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Image 
              src="/church-logo.png"
              alt="Church Logo" 
              width={96}
              height={96}
              style={{ objectFit: 'contain', margin: '0 auto' }}
              className="h-24 w-auto"
            />
          </motion.div>
          <AnimatedText 
            text="2819 CHURCH"
            className="text-6xl font-bold text-black mb-4"
          />
          <AnimatedText 
            text="Guest Registration Status"
            className="text-2xl text-gray-600"
            delay={0.5}
          />
        </AnimatedSection>

        {error && (
          <AnimatedSection className="mb-8">
            <Alert className="border-2 border-red-600 bg-red-50">
              <AlertDescription className="text-red-800 text-xl">
                {error}
              </AlertDescription>
            </Alert>
          </AnimatedSection>
        )}

        {!submission && !verificationSuccess && !needsPhoneVerification && (
          <AnimatedSection delay={0.3}>
            <Card className="border-2 border-black shadow-2xl">
              <CardHeader className="bg-black text-white">
                <CardTitle className="text-3xl font-bold">Check Registration Status</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="submissionId" className="text-xl">Submission ID</Label>
                    <Input
                      id="submissionId"
                      value={submissionId}
                      onChange={(e) => setSubmissionId(e.target.value)}
                      required
                      className="border-2 border-gray-300 focus:border-red-600 py-4"
                      placeholder="Enter your submission ID"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-6 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Check Status
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {needsPhoneVerification && !verificationSuccess && (
          <AnimatedSection delay={0.3}>
            <Card className="border-2 border-black shadow-2xl">
              <CardHeader className="bg-black text-white">
                <CardTitle className="text-3xl font-bold">Verify Your Identity</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="mb-6">
                  <p className="text-gray-800">
                    To check your registration status, please enter the phone number you used during registration.
                  </p>
                </div>
                <form onSubmit={handleVerifyPhone} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="phoneNumber" className="text-xl">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="border-2 border-gray-300 focus:border-red-600 py-4"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-6 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Verify
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {submission && verificationSuccess && (
          <AnimatedSection delay={0.3}>
            <Card className="border-2 border-black shadow-2xl">
              <CardHeader className="bg-black text-white">
                <CardTitle className="text-3xl font-bold">Registration Status</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="mb-8 flex justify-center">
                  {getStatusBadge(submission.status)}
                </div>
                <div className="mb-8">
                  {getStatusMessage(submission.status)}
                </div>
                
                <div className="border-t-2 border-gray-200 pt-6 mb-8">
                  <h3 className="text-2xl font-bold text-black mb-6">Your Submission Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-500 text-sm">Name</p>
                        <p className="text-lg font-medium">{submission.firstName} {submission.lastName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Email</p>
                        <p className="text-lg">{submission.email || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm">Phone</p>
                        <p className="text-lg">{submission.phone}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-red-600" />
                          Visit Date
                        </p>
                        <p className="text-lg">
                          {new Date(submission.visitDate).toLocaleDateString()} at {submission.gatheringTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                          <Users className="w-4 h-4 text-red-600" />
                          Total Guests
                        </p>
                        <p className="text-lg">{submission.totalGuests}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                          <Car className="w-4 h-4 text-red-600" />
                          Vehicle Type
                        </p>
                        <p className="text-lg">{submission.carType}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {submission.status === GuestStatus.APPROVED && submission.qrCode && (
                  <div className="border-t-2 border-gray-200 pt-6">
                    <h3 className="text-2xl font-bold text-black mb-4 text-center">Your QR Code</h3>
                    
                    <div className="flex justify-center mb-4">
                      <QRCodeDisplay 
                        value={submission.qrCode} 
                        size={200}
                        guestInfo={{ firstName: submission.firstName, lastName: submission.lastName }}
                        showDirections={true}
                      />
                    </div>
                    
                    {submission.qrExpiry && (
                      <p className="text-center text-gray-500 mt-4">
                        QR Code valid until {new Date(submission.qrExpiry).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-8">
                  <Button 
                    onClick={() => {
                      setSubmission(null)
                      setVerificationSuccess(false)
                      setNeedsPhoneVerification(false)
                      setSubmissionId('')
                      setPhoneNumber('')
                    }}
                    variant="outline"
                    className="w-full border-red-600 text-red-600 hover:bg-red-50 py-4"
                  >
                    Check Another Registration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        <AnimatedSection delay={0.5} className="text-center mt-12">
          <p className="text-xl text-gray-500">
            2819 Church Guest Registration System
          </p>
          <p className="text-lg mt-4">
            Questions? Contact <a href="mailto:info@2819church.org" className="text-red-600 hover:underline">info@2819church.org</a>
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}
