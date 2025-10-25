import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Separator } from './ui/separator'
import { CheckCircle, XCircle, Clock, LogOut, Users, Calendar, Car, Heart, MessageSquare, Phone, Mail, Baby } from 'lucide-react'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { FloatingElements } from './FloatingElements'
import { motion } from 'motion/react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import churchLogo from 'figma:asset/8a0d7e407ac0e2cb1219f412ca5d6c6eb8ea3b1c.png'

interface AdminDashboardProps {
  user: any
  onLogout: () => void
}

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
  profilePictureUrl: string
  submittedAt: string
  status: 'pending' | 'approved' | 'denied'
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-66bf82e5/admin/submissions`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token || publicAnonKey}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (submissionId: string, action: 'approve' | 'deny') => {
    setActionLoading(submissionId)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-66bf82e5/admin/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || publicAnonKey}`
        },
        body: JSON.stringify({
          submissionId,
          action,
          reviewedBy: user?.email
        })
      })

      if (!response.ok) {
        throw new Error('Failed to review submission')
      }

      const data = await response.json()
      setMessage(`Submission ${action === 'approve' ? 'approved' : 'denied'} successfully!`)
      
      // Remove the reviewed submission from the list
      setSubmissions(prev => prev.filter(sub => sub.id !== submissionId))
    } catch (err: any) {
      setError(err.message || 'Failed to review submission')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <FloatingElements />
        <div className="text-center">
          <motion.div
            className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-2xl text-black font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Loading submissions...
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative">
      <FloatingElements />
      {/* Header */}
      <div className="bg-black shadow-2xl border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <AnimatedSection>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <motion.img 
                  src={churchLogo} 
                  alt="2819 Church Logo" 
                  className="h-16 w-auto filter brightness-0 invert"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
                <div>
                  <AnimatedText 
                    text="Admin Dashboard"
                    className="text-3xl font-bold text-white"
                  />
                  <AnimatedText 
                    text="2819 Church Guest Registration"
                    className="text-xl text-gray-300"
                    delay={0.3}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <span className="text-xl text-gray-300">Welcome, {user?.user_metadata?.name || user?.email}</span>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    onClick={onLogout}
                    className="flex items-center gap-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-xl py-3 px-6"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Button>
                </motion.div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Messages */}
        {message && (
          <AnimatedSection className="mb-8">
            <Alert className="border-2 border-green-600 bg-green-50">
              <CheckCircle className="h-6 w-6" />
              <AlertDescription className="text-green-800 text-xl">
                {message}
              </AlertDescription>
            </Alert>
          </AnimatedSection>
        )}

        {error && (
          <AnimatedSection className="mb-8">
            <Alert className="border-2 border-red-600 bg-red-50">
              <XCircle className="h-6 w-6" />
              <AlertDescription className="text-red-800 text-xl">
                {error}
              </AlertDescription>
            </Alert>
          </AnimatedSection>
        )}

        {/* Stats */}
        <AnimatedSection delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Card className="border-2 border-black shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl text-gray-600">Pending Registrations</p>
                      <p className="text-4xl font-bold text-black">{submissions.length}</p>
                    </div>
                    <Clock className="h-12 w-12 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Card className="border-2 border-black shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl text-gray-600">Total Guests</p>
                      <p className="text-4xl font-bold text-black">
                        {submissions.reduce((sum, sub) => sum + sub.totalGuests, 0)}
                      </p>
                    </div>
                    <Users className="h-12 w-12 text-black" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Card className="border-2 border-black shadow-xl">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl text-gray-600">Children Registered</p>
                      <p className="text-4xl font-bold text-black">
                        {submissions.reduce((sum, sub) => sum + (sub.childrenInfo?.length || 0), 0)}
                      </p>
                    </div>
                    <Heart className="h-12 w-12 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Pending Submissions */}
        <AnimatedSection delay={0.4}>
          <Card className="border-2 border-black shadow-2xl">
            <CardHeader className="bg-black text-white">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-red-600" />
                <AnimatedText 
                  text="Pending Guest Registrations"
                  className="text-3xl font-bold"
                />
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-2xl text-gray-500">No pending registrations</p>
                  <p className="text-xl text-gray-400 mt-2">All caught up! 🎉</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {submissions.map((submission, index) => (
                    <motion.div 
                      key={submission.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                        {/* Guest Info Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={submission.profilePictureUrl} alt={`${submission.firstName} ${submission.lastName}`} />
                              <AvatarFallback className="text-xl">
                                {submission.firstName[0]}{submission.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-2xl font-bold text-black">
                                {submission.firstName} {submission.lastName}
                              </h3>
                              <div className="flex items-center gap-4 text-lg text-gray-600 mt-1">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  {submission.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  {submission.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-lg px-4 py-2">
                            {submission.status}
                          </Badge>
                        </div>

                        {/* Visit Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-lg font-medium">Visit Date</p>
                              <p className="text-lg text-gray-600">{formatDate(submission.visitDate)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-lg font-medium">Time</p>
                              <p className="text-lg text-gray-600">{formatTime(submission.gatheringTime)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-lg font-medium">Total Guests</p>
                              <p className="text-lg text-gray-600">{submission.totalGuests}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-lg font-medium">Vehicle</p>
                              <p className="text-lg text-gray-600">{submission.carType}</p>
                              {submission.vehicleMake && (
                                <p className="text-base text-gray-500">
                                  {submission.vehicleMake} {submission.vehicleModel} ({submission.vehicleColor})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Children Info */}
                        {submission.hasChildrenForFormationKids && submission.childrenInfo.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Baby className="h-5 w-5 text-gray-500" />
                              <span className="text-lg font-bold">Formation Kids:</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {submission.childrenInfo.map((child, childIndex) => (
                                <div key={childIndex} className="bg-white p-4 rounded border">
                                  <p className="font-bold text-lg">{child.name}</p>
                                  <p className="text-base text-gray-600">DOB: {child.dob}</p>
                                  {child.allergies && (
                                    <p className="text-base text-red-600 mt-1">
                                      <strong>Allergies:</strong> {child.allergies}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Info */}
                        {(submission.foodAllergies || submission.specialNeeds || submission.additionalNotes) && (
                          <div className="mb-6 space-y-3">
                            {submission.foodAllergies && (
                              <div className="text-lg">
                                <span className="font-bold">Food Allergies:</span> {submission.foodAllergies}
                              </div>
                            )}
                            {submission.specialNeeds && (
                              <div className="text-lg">
                                <span className="font-bold">Special Needs:</span> {submission.specialNeeds}
                              </div>
                            )}
                            {submission.additionalNotes && (
                              <div className="text-lg">
                                <span className="font-bold">Additional Notes:</span> {submission.additionalNotes}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Submission Info */}
                        <div className="flex items-center justify-between pt-6 border-t-2 border-gray-300">
                          <div className="text-lg text-gray-500">
                            Submitted: {formatDate(submission.submittedAt)}
                          </div>
                          <div className="flex items-center gap-4">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() => handleReview(submission.id, 'deny')}
                                disabled={actionLoading === submission.id}
                                className="border-2 border-red-600 text-red-600 hover:bg-red-50 text-xl py-3 px-6"
                              >
                                {actionLoading === submission.id ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="inline-block"
                                  >
                                    ⟳
                                  </motion.div>
                                ) : (
                                  <>
                                    <XCircle className="h-5 w-5 mr-2" />
                                    Deny
                                  </>
                                )}
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                size="lg"
                                onClick={() => handleReview(submission.id, 'approve')}
                                disabled={actionLoading === submission.id}
                                className="bg-green-600 hover:bg-green-700 text-xl py-3 px-6"
                              >
                                {actionLoading === submission.id ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="inline-block"
                                  >
                                    ⟳
                                  </motion.div>
                                ) : (
                                  <>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Approve
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                      {index < submissions.length - 1 && <Separator className="my-8" />}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  )
}