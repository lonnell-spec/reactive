'use client'

import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, Calendar, Car, Heart, MessageSquare, Phone, Mail, Baby } from 'lucide-react'
import { GuestStatus } from '@/lib/types'
import { ProfileImage } from './ProfileImage'
import { ChildPhoto } from './ChildPhoto'
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
    id: string
    name: string
    dob: string
    allergies: string
    photo_path: string
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

// Removed UserRoles interface - all users have access to all actions

interface GuestDetailsModalProps {
  submission: Submission | null
  actionLoading: string | null
  onClose: () => void
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
  actionLoading,
  onClose,
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
            <div className="flex flex-col pb-6 border-b border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                  <ProfileImage
                    profilePath={submission.profilePicture}
                    alt={`${submission.firstName} ${submission.lastName}`}
                    width={160}
                    height={160}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold text-black break-words">
                    {submission.firstName} {submission.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Submitted {getRelativeTime(submission.submittedAt)}
                  </p>
                </div>
              </div>
              
              <div className="w-full">
                {submission.status === 'pending' && (
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={() => onApprove(submission.id)}
                      className="bg-green-600 hover:bg-green-700 text-white w-full"
                      disabled={actionLoading === submission.id}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Guest
                    </Button>
                    <Button 
                      onClick={() => onDeny(submission.id)}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 w-full"
                      disabled={actionLoading === submission.id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Deny Guest
                    </Button>
                  </div>
                )}
                {submission.status === 'approved' && (
                  <Badge className="bg-green-600 text-white py-2 px-4 text-base w-full justify-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approved
                  </Badge>
                )}
                {submission.status === 'denied' && (
                  <Badge className="bg-red-600 text-white py-2 px-4 text-base w-full justify-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    Denied
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
              <h4 className="text-lg font-medium text-black mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-red-600" />
                Visit Details
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Visit Date</p>
                  <p className="text-base sm:text-lg break-words">{formatDate(submission.visitDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Gathering Time</p>
                  <p className="text-base sm:text-lg break-words">{submission.gatheringTime}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total Guests</p>
                  <p className="text-base sm:text-lg">{submission.totalGuests}</p>
                </div>
              </div>
            </div>
            
            {/* Contact details */}
            <div className="pb-6 border-b border-gray-200">
              <h4 className="text-lg font-medium text-black mb-4">Contact Information</h4>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Phone className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-500 text-sm">Phone</p>
                    <p className="text-base sm:text-lg break-all">{submission.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="w-5 h-5 mr-3 text-gray-500 flex-shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-500 text-sm">Email</p>
                    <p className="text-base sm:text-lg break-all">{submission.email || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Vehicle info */}
            <div className="pb-6 border-b border-gray-200">
              <h4 className="text-lg font-medium text-black mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-red-600" />
                Vehicle Information
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Type</p>
                  <p className="text-base sm:text-lg break-words">{submission.carType}</p>
                </div>
                {submission.vehicleMake && (
                  <div>
                    <p className="text-gray-500 text-sm">Make</p>
                    <p className="text-base sm:text-lg break-words">{submission.vehicleMake}</p>
                  </div>
                )}
                {submission.vehicleModel && (
                  <div>
                    <p className="text-gray-500 text-sm">Model</p>
                    <p className="text-base sm:text-lg break-words">{submission.vehicleModel}</p>
                  </div>
                )}
                {submission.vehicleColor && (
                  <div>
                    <p className="text-gray-500 text-sm">Color</p>
                    <p className="text-base sm:text-lg break-words">{submission.vehicleColor}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Children */}
            {submission.hasChildrenForFormationKids && (
              <div className="pb-6 border-b border-gray-200">
                <h4 className="text-lg font-medium text-black mb-4 flex items-center">
                  <Baby className="w-5 h-5 mr-2 text-red-600" />
                  Children for Formation Kids
                </h4>
                
                {submission.childrenInfo.length > 0 ? (
                  <div className="space-y-4">
                    {submission.childrenInfo.map((child, index) => (
                      <Card key={child.id || index} className="bg-gray-50 p-4 border border-gray-200">
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Child Photo */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden">
                              <ChildPhoto
                                photoPath={child.photo_path}
                                alt={`Photo of ${child.name}`}
                                width={160}
                                height={160}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          </div>
                          
                          {/* Child Information */}
                          <div className="flex-1 space-y-4">
                            <div>
                              <p className="text-gray-500 text-sm">Name</p>
                              <p className="text-base sm:text-lg font-medium break-words">{child.name}</p>
                            </div>
                            {child.dob && (
                              <div>
                                <p className="text-gray-500 text-sm">Date of Birth</p>
                                <p className="text-base sm:text-lg break-words">{formatDate(child.dob)}</p>
                              </div>
                            )}
                            {child.allergies && (
                              <div>
                                <p className="text-gray-500 text-sm">Allergies/Special Needs</p>
                                <p className="text-base sm:text-lg break-words">{child.allergies}</p>
                              </div>
                            )}
                          </div>
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
              <h4 className="text-lg font-medium text-black mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-red-600" />
                Additional Information
              </h4>
              
              {(submission.foodAllergies || submission.specialNeeds || submission.additionalNotes) ? (
                <div className="space-y-4">
                  {submission.foodAllergies && (
                    <div>
                      <p className="text-gray-500 text-sm">Food Allergies</p>
                      <div className="text-base sm:text-lg bg-gray-50 p-3 border border-gray-200 rounded-md break-words">
                        {submission.foodAllergies}
                      </div>
                    </div>
                  )}
                  
                  {submission.specialNeeds && (
                    <div>
                      <p className="text-gray-500 text-sm">Special Needs</p>
                      <div className="text-base sm:text-lg bg-gray-50 p-3 border border-gray-200 rounded-md break-words">
                        {submission.specialNeeds}
                      </div>
                    </div>
                  )}
                  
                  {submission.additionalNotes && (
                    <div>
                      <p className="text-gray-500 text-sm">Additional Notes</p>
                      <div className="text-base sm:text-lg bg-gray-50 p-3 border border-gray-200 rounded-md break-words">
                        {submission.additionalNotes}
                      </div>
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
