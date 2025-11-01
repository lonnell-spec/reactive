'use client'

import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { GuestStatus } from '@/lib/types'
import { ProfileImage } from './ProfileImage'

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

interface GuestListingProps {
  title: string
  submissions: Submission[]
  onSubmissionClick: (id: string) => void
  onRefresh?: () => void
  formatDate: (date: string) => string
  getRelativeTime: (date: string) => string
  emptyMessage?: string
  headerClassName?: string
}

/**
 * Reusable component for displaying a list of guest submissions
 * Handles both active and completed submissions with appropriate styling
 */
export function GuestListing({
  title,
  submissions,
  onSubmissionClick,
  onRefresh,
  formatDate,
  getRelativeTime,
  emptyMessage = "No submissions found.",
  headerClassName = "bg-gray-50 border-b-2 border-gray-200"
}: GuestListingProps) {
  if (submissions.length === 0) {
    return (
      <Card className="border-2 border-gray-200 shadow-md">
        <CardContent className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-xl text-gray-600 mb-4">
              {emptyMessage}
            </p>
            {onRefresh && (
              <Button
                onClick={onRefresh}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh List
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-gray-200 shadow-md">
      <CardHeader className={headerClassName}>
        <CardTitle className="text-xl text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-gray-200">
        {submissions.map(submission => (
          <div 
            key={submission.id}
            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onSubmissionClick(submission.id)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                  <ProfileImage
                    profilePath={submission.profilePicture}
                    alt={`${submission.firstName} ${submission.lastName}`}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
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
                
                {/* Status badges */}
                {submission.status === 'pending_pre_approval' && (
                  <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Pre-Approval
                  </Badge>
                )}
                
                {submission.status === 'pending' && (
                  <Badge className="bg-blue-50 text-blue-800 border border-blue-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
                
                {submission.status === 'approved' && (
                  <Badge className="bg-green-50 text-green-800 border border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                )}
                
                {submission.status === 'denied' && (
                  <Badge className="bg-red-50 text-red-800 border border-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Denied
                  </Badge>
                )}
                
                {submission.status === 'pre_approval_denied' && (
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
  )
}

export default GuestListing
