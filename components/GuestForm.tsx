'use client'

import { useState } from 'react'
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Search } from 'lucide-react'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { FloatingElements } from './FloatingElements'
import { submitGuestForm } from '@/lib/guest-form-actions'
import { guestFormSchema, GuestFormData } from '@/lib/types'
import { GuestFormSubmitted } from './forms/GuestFormSubmitted'
import { PersonalInformationSection } from './forms/sections/PersonalInformationSection'
import { VisitDetailsSection } from './forms/sections/VisitDetailsSection'
import { ChildrenInformationSection } from './forms/sections/ChildrenInformationSection'
import { VehicleInformationSection } from './forms/sections/VehicleInformationSection'
import { AdditionalInformationSection } from './forms/sections/AdditionalInformationSection'

export function GuestForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [submissionId, setSubmissionId] = useState('')
  
  // Initialize React Hook Form with proper typing
  const methods = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      visitDate: '',
      gatheringTime: '',
      totalGuests: '1',
      hasChildrenForFormationKids: false,
      childrenInfo: [],
      carType: '',
      vehicleColor: '',
      vehicleMake: '',
      vehicleModel: '',
      foodAllergies: '',
      specialNeeds: '',
      additionalNotes: ''
    }
  });

  // Form submission handler using React Hook Form with explicit typing
  const onSubmit: SubmitHandler<GuestFormData> = async (data) => {
    setLoading(true)
    setError('')
    
    try {
      // Create form data to send to the server
      const formData = new FormData()
      formData.append('firstName', data.firstName)
      formData.append('lastName', data.lastName)
      formData.append('email', data.email)
      formData.append('phone', data.phone)
      formData.append('visitDate', data.visitDate)
      formData.append('gatheringTime', data.gatheringTime)
      formData.append('totalGuests', data.totalGuests)
      formData.append('hasChildrenForFormationKids', data.hasChildrenForFormationKids.toString())
      
      // We need to stringify childrenInfo but exclude the photo files
      // as they'll be appended separately to avoid JSON serialization issues
      const childrenInfoWithoutPhotos = data.childrenInfo.map(child => ({
        name: child.name,
        dob: child.dob,
        allergies: child.allergies || ''
      }));
      
      formData.append('childrenInfo', JSON.stringify(childrenInfoWithoutPhotos))
      formData.append('carType', data.carType)
      formData.append('vehicleColor', data.vehicleColor || '')
      formData.append('vehicleMake', data.vehicleMake || '')
      formData.append('vehicleModel', data.vehicleModel || '')
      formData.append('foodAllergies', data.foodAllergies || '')
      formData.append('specialNeeds', data.specialNeeds || '')
      formData.append('additionalNotes', data.additionalNotes || '')
      
      // Add profile picture - this is already validated by Zod
      formData.append('profilePicture', data.profilePicture!)

      // Add child photos
      data.childrenInfo.forEach((child, index) => {
        if (child.photo) {
          formData.append(`childPhoto_${index}`, child.photo)
        }
      })

      // Submit the form using the server action
      const result = await submitGuestForm(formData)

      if (!result.success) {
        throw new Error(result.message || 'Submission failed')
      }

      setSubmissionId(result.submissionId!)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <GuestFormSubmitted submissionId={submissionId} />
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 relative">
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
            text="Pastor Philip Anthony Mitchell's Guest Registration"
            className="text-2xl text-gray-600"
            delay={0.5}
          />
        </AnimatedSection>

        {error && (
          <AnimatedSection className="mb-8">
            <Alert variant="destructive" className="border-2 border-red-600 bg-red-50">
              <AlertDescription className="text-red-800 text-xl">
                {error}
              </AlertDescription>
            </Alert>
          </AnimatedSection>
        )}

        <AnimatedSection delay={0.3}>
          <Card className="border-2 border-black shadow-2xl">
            <CardHeader className="bg-black text-white">
              <AnimatedText 
                text="Guest Information"
                className="text-3xl font-bold"
              />
            </CardHeader>
            <CardContent className="p-8">
              <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-10">
                  <PersonalInformationSection />
                  <VisitDetailsSection />
                  <ChildrenInformationSection />
                  <VehicleInformationSection />
                  <AdditionalInformationSection />

                  <AnimatedSection delay={0.6}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-2xl py-8 border-2 border-red-800 shadow-lg text-[20px]"
                        disabled={loading}
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block"
                          >
                            ⟳
                          </motion.div>
                        ) : (
                          'Submit Guest Registration'
                        )}
                      </Button>
                    </motion.div>
                  </AnimatedSection>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Footer */}
        <AnimatedSection delay={0.7} className="text-center mt-12">
          <p className="text-xl text-gray-500">
            2819 Church Guest Registration System
          </p>
          <p className="text-lg text-red-600 mt-4 font-medium">
            Sharing this private link is prohibited and can prevent guests from being approved in the future.
          </p>
          
          <div className="mt-8 flex justify-center">
            <Link href="/status" className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200">
              <Search className="w-3 h-3 mr-1" />
              Check Registration Status
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </div>
  )
}

