'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, Calendar, Phone, User, Clock } from 'lucide-react'
import { ProfileImage } from './ProfileImage'
import { PassVerificationResult } from '@/lib/pass-verification'
import { formatTimestamp, formatVisitDate } from '@/lib/date-timezone-utils'

interface PassDetailsDisplayProps {
  verificationResult: PassVerificationResult
  onMarkAttended: () => Promise<void>
  isMarkingAttended: boolean
}

/**
 * Component for displaying guest pass verification results
 * Shows guest details if pass is valid, or error message if invalid
 */
export function PassDetailsDisplay({
  verificationResult,
  onMarkAttended,
  isMarkingAttended
}: PassDetailsDisplayProps) {
  const formatDate = (dateString: string) => {
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

  if (!verificationResult.success) {
    return (
      <Card className="border-2 border-red-600 shadow-xl max-w-2xl mx-auto w-full">
        <CardHeader className="bg-red-600 text-white text-center">
          <div className="flex items-center justify-center mb-4">
            <XCircle className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl">Invalid Pass</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-8 text-center">
          <p className="text-xl text-red-800 mb-6">
            {verificationResult.message}
          </p>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            Access Denied
          </Badge>
        </CardContent>
      </Card>
    )
  }

  const { guest } = verificationResult

  if (!guest) {
    return (
      <Card className="border-2 border-red-600 shadow-xl max-w-2xl mx-auto w-full">
        <CardContent className="p-4 sm:p-8 text-center">
          <p className="text-xl text-red-800">No guest data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-green-600 shadow-xl max-w-2xl mx-auto w-full">
      <CardHeader className="bg-green-600 text-white text-center">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-16 h-16" />
        </div>
        <CardTitle className="text-2xl">Valid Guest Pass</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Guest Profile Section */}
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full overflow-hidden">
              <ProfileImage
                profilePath={guest.profilePicture}
                alt={`${guest.firstName} ${guest.lastName}`}
                width={160}
                height={160}
                className="object-cover w-full h-full"
              />
            </div>
            <h3 className="text-3xl font-bold text-black mb-2">
              {guest.firstName} {guest.lastName}
            </h3>
            <div className="flex items-center justify-center text-gray-600 mb-4">
              <Phone className="w-5 h-5 mr-2" />
              <span className="text-xl">{guest.phone}</span>
            </div>
            <Badge className="bg-green-600 text-white py-2 px-4 text-lg">
              <CheckCircle className="w-5 h-5 mr-2" />
              Verified Guest
            </Badge>
          </div>

          {/* Visit Information */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border-2 border-gray-200">
            <h4 className="text-xl font-semibold text-black mb-4 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-green-600" />
              Visit Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Visit Date</p>
                <p className="text-lg font-medium">{formatDate(guest.visitDate)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Gathering Time</p>
                <p className="text-lg font-medium">{guest.gatheringTime}</p>
              </div>
            </div>
          </div>

          {/* Pass Status */}
          <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border-2 border-blue-200">
            <h4 className="text-xl font-semibold text-black mb-4 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-600" />
              Pass Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-sm">Expires</p>
                <p className="text-lg font-medium">{formatTime(guest.expiresAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Status</p>
                <Badge className={guest.isUsed ? "bg-gray-600" : "bg-green-600"}>
                  {guest.isUsed ? "Already Used" : "Available"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Mark Attended Button */}
          {!guest.isUsed && (
            <div className="text-center pt-4">
              <Button
                onClick={onMarkAttended}
                disabled={isMarkingAttended}
                className="bg-green-600 hover:bg-green-700 text-white text-xl py-4 px-8"
                size="lg"
              >
                {isMarkingAttended ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Marking Attended...
                  </>
                ) : (
                  <>
                    <User className="w-6 h-6 mr-2" />
                    Mark as Attended
                  </>
                )}
              </Button>
            </div>
          )}

          {guest.isUsed && (
            <div className="text-center pt-4">
              <Badge variant="secondary" className="text-lg px-6 py-3">
                <CheckCircle className="w-5 h-5 mr-2" />
                Guest Has Already Attended
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PassDetailsDisplay
