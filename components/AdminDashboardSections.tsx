// This file contains the sections for the AdminDashboard component

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Clock, CheckCircle, XCircle, RefreshCw, Calendar, Phone, Mail } from 'lucide-react';
import Image from 'next/image';
import { GuestStatus } from '@/lib/types';
import { motion } from 'motion/react';

// Types
interface Submission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visitDate: string;
  gatheringTime: string;
  totalGuests: number;
  hasChildrenForFormationKids: boolean;
  childrenInfo: Array<any>;
  carType: string;
  vehicleColor: string;
  vehicleMake: string;
  vehicleModel: string;
  foodAllergies: string;
  specialNeeds: string;
  additionalNotes: string;
  status: string;
  profilePicture: string;
  submittedAt: string;
  preApprovedBy?: string;
  preApprovedAt?: string;
}

interface SectionProps {
  submissions: Submission[];
  title: string;
  emptyMessage: string;
  onRefresh: () => void;
  onSelectSubmission: (id: string) => void;
  formatDate: (dateString: string) => string;
  getRelativeTime: (dateString: string) => string;
  getProfilePicUrl: (path: string) => string;
}

// Pre-approval Section Component
export const PreApprovalSection: React.FC<SectionProps> = ({
  submissions,
  title,
  emptyMessage,
  onRefresh,
  onSelectSubmission,
  formatDate,
  getRelativeTime,
  getProfilePicUrl,
}) => {
  if (submissions.length === 0) {
    return (
      <Card className="border-2 border-gray-200 shadow-md">
        <CardContent className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-xl text-gray-600 mb-4">{emptyMessage}</p>
            <Button onClick={onRefresh} className="bg-red-600 hover:bg-red-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gray-200 shadow-md">
      <CardHeader className="bg-yellow-50 border-b-2 border-yellow-200">
        <CardTitle className="text-xl text-yellow-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-gray-200">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onSelectSubmission(submission.id)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                  {submission.profilePicture ? (
                    <Image
                      src={getProfilePicUrl(submission.profilePicture)}
                      alt={`${submission.firstName} ${submission.lastName}`}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                      No Img
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-medium">
                    {submission.firstName} {submission.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Visiting on {formatDate(submission.visitDate)} • {submission.totalGuests} guest
                    {submission.totalGuests > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600 hidden md:block">
                  {getRelativeTime(submission.submittedAt)}
                </p>

                <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Pre-Approval
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Pending Section Component
export const PendingSection: React.FC<SectionProps> = ({
  submissions,
  title,
  emptyMessage,
  onRefresh,
  onSelectSubmission,
  formatDate,
  getRelativeTime,
  getProfilePicUrl,
}) => {
  if (submissions.length === 0) {
    return (
      <Card className="border-2 border-gray-200 shadow-md">
        <CardContent className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-xl text-gray-600 mb-4">{emptyMessage}</p>
            <Button onClick={onRefresh} className="bg-red-600 hover:bg-red-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gray-200 shadow-md">
      <CardHeader className="bg-blue-50 border-b-2 border-blue-200">
        <CardTitle className="text-xl text-blue-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-gray-200">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onSelectSubmission(submission.id)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden">
                  {submission.profilePicture ? (
                    <Image
                      src={getProfilePicUrl(submission.profilePicture)}
                      alt={`${submission.firstName} ${submission.lastName}`}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                      No Img
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-medium">
                    {submission.firstName} {submission.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Visiting on {formatDate(submission.visitDate)} • {submission.totalGuests} guest
                    {submission.totalGuests > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600 hidden md:block">
                  {getRelativeTime(submission.submittedAt)}
                </p>

                {submission.status === GuestStatus.PENDING && (
                  <Badge className="bg-blue-50 text-blue-800 border border-blue-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}

                {submission.status === GuestStatus.APPROVED && (
                  <Badge className="bg-green-50 text-green-800 border border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                )}

                {submission.status === GuestStatus.DENIED && (
                  <Badge className="bg-red-50 text-red-800 border border-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Denied
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Active Submission Detail Component
interface ActiveSubmissionDetailProps {
  activeSubmission: string | null;
  pendingPreApprovalSubmissions: Submission[];
  pendingSubmissions: Submission[];
  handlePreApprove: (id: string) => Promise<void>;
  handlePreApprovalDeny: (id: string) => Promise<void>;
  handleApprove: (id: string) => Promise<void>;
  handleDeny: (id: string) => Promise<void>;
  actionLoading: string | null;
  onClose: () => void;
  formatDate: (dateString: string) => string;
  getProfilePicUrl: (path: string) => string;
  user: any; // Consider replacing 'any' with a more specific type if available
}

export const ActiveSubmissionDetail = ({
  activeSubmission,
  pendingPreApprovalSubmissions,
  pendingSubmissions,
  handlePreApprove,
  handlePreApprovalDeny,
  handleApprove,
  handleDeny,
  actionLoading,
  onClose,
  formatDate,
  getProfilePicUrl,
  user,
}: ActiveSubmissionDetailProps) => {
  // Combine both submission arrays to find the active one
  const allSubmissions = [...pendingPreApprovalSubmissions, ...pendingSubmissions];
  const submission = allSubmissions.find(sub => sub.id === activeSubmission);

  if (!submission) return null;

  const isPendingPreApproval = submission.status === GuestStatus.PENDING_PRE_APPROVAL;
  
  return (
    <Card className="border-2 border-black shadow-xl mb-8">
      <CardHeader className="bg-black text-white flex flex-row justify-between items-center">
        <CardTitle className="text-2xl">Guest Details</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="border-white text-white hover:bg-gray-800"
          onClick={onClose}
        >
          Close
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Guest header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden">
                {submission.profilePicture ? (
                  <Image
                    src={getProfilePicUrl(submission.profilePicture)}
                    alt={`${submission.firstName} ${submission.lastName}`}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    No Img
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-black">
                  {submission.firstName} {submission.lastName}
                </h3>
                <p className="text-gray-600">
                  Submitted {formatDate(submission.submittedAt)}
                </p>
              </div>
            </div>

            <div>
              {isPendingPreApproval ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handlePreApprove(submission.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={actionLoading === submission.id}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pre-Approve
                  </Button>
                  <Button
                    onClick={() => handlePreApprovalDeny(submission.id)}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    disabled={actionLoading === submission.id}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny Pre-Approval
                  </Button>
                </div>
              ) : submission.status === GuestStatus.PENDING ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleApprove(submission.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={actionLoading === submission.id}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Guest
                  </Button>
                  <Button
                    onClick={() => handleDeny(submission.id)}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    disabled={actionLoading === submission.id}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Deny Guest
                  </Button>
                </div>
              ) : submission.status === GuestStatus.APPROVED ? (
                <Badge className="bg-green-600 text-white py-1 px-3 text-lg">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approved
                </Badge>
              ) : (
                <Badge className="bg-red-600 text-white py-1 px-3 text-lg">
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
              <p className="text-gray-600">Pre-approved by: {submission.preApprovedBy}</p>
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
                  <p className="text-lg">{submission.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional sections can be added here */}
        </div>
      </CardContent>
    </Card>
  );
};
