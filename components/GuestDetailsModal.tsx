'use client'

import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, Calendar, Car, Heart, MessageSquare, Phone, Mail, Baby } from 'lucide-react'
import { GuestStatus } from '@/lib/types'
import { ProfileImage } from './ProfileImage'
import { Modal } from './ui/modal'

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

interface UserRoles {
  isPreApprover: boolean
  isAdmin: boolean
}

interface GuestDetailsModalProps {
  submission: Submission | null
  userRoles: UserRoles
  actionLoading: string | null
  onClose: () => void
  onPreApprove: (id: string) => void
  onPreApprovalDeny: (id: string) => void
  onApprove: (id: string) => void
  onDeny: (id: string) => void
  getRelativeTime: (date: string) => string
  formatDate: (date: string) => string
}

/**
 * Modal component for displaying detailed guest submission information
 * with approval/denial actions based on user roles
 */
export function GuestDetailsModal({
  submission,
  userRoles,
  actionLoading,
  onClose,
  onPreApprove,
  onPreApprovalDeny,
  onApprove,
  onDeny,
  getRelativeTime,
  formatDate
}: GuestDetailsModalProps) {
  return (
    <Modal
      isOpen={!!submission}
      onClose={onClose}
      title="Guest Details"
      className="max-w-5xl"
    >
      {submission && (
        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
          <div className="space-y-8">
            {/* Guest header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden">
                  <ProfileImage
                    profilePath={submission.profilePicture}
                    alt={`${submission.firstName} ${submission.lastName}`}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
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
                {submission.status === 'pending_pre_approval' && userRoles.isPreApprover && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => onPreApprove(submission.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={actionLoading === submission.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Pre-Approve
                    </Button>
                    <Button 
                      onClick={() => onPreApprovalDeny(submission.id)}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                      disabled={actionLoading === submission.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Deny Pre-Approval
                    </Button>
                  </div>
                )}
                {submission.status === 'pending' && userRoles.isAdmin && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => onApprove(submission.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={actionLoading === submission.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Guest
                    </Button>
                    <Button 
                      onClick={() => onDeny(submission.id)}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                      disabled={actionLoading === submission.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Deny Guest
                    </Button>
                  </div>
                )}
                {submission.status === 'approved' && (
                  <Badge className="bg-green-600 text-white py-1 px-3 text-lg">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approved
                  </Badge>
                )}
                {submission.status === 'denied' && (
                  <Badge className="bg-red-600 text-white py-1 px-3 text-lg">
                    <XCircle className="w-4 h-4 mr-1" />
                    Denied
                  </Badge>
                )}
                {submission.status === 'pre_approval_denied' && (
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
        </CardContent>
      </Card>
      )}
    </Modal>
  )
}

export default GuestDetailsModal
