'use client'

import { useState } from 'react'
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import Image from 'next/image'
import { motion } from 'motion/react'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { submitGuestForm } from '@/lib/guest-form-actions'
import { guestFormSchema, GuestFormData } from '@/lib/types'
import { stripPhoneFormatting } from '@/lib/phone-utils'
import { GuestFormSubmitted } from './forms/GuestFormSubmitted'
import { PersonalInformationSection } from './forms/sections/PersonalInformationSection'
import { VisitDetailsSection } from './forms/sections/VisitDetailsSection'
import { ChildrenInformationSection } from './forms/sections/ChildrenInformationSection'
import { VehicleInformationSection } from './forms/sections/VehicleInformationSection'
import { AdditionalInformationSection } from './forms/sections/AdditionalInformationSection'
import { CompressionProvider, useCompression } from './forms/CompressionContext'
import { Turnstile } from './ui/turnstile'

function GuestFormInner() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [submissionId, setSubmissionId] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string>('')
  const { isAnyCompressing } = useCompression()
  
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

  const onSubmit: SubmitHandler<GuestFormData> = async (data) => {
    if (isAnyCompressing) {
      setError('Please wait for image compression to complete before submitting.')
      return
    }

    if (!turnstileToken) {
      setError('Please complete the verification challenge before submitting.')
      return
    }
    
    if (data.profilePicture) {
      if (!(data.profilePicture instanceof File) || data.profilePicture.size === 0) {
        setError('Profile picture is invalid. Please try uploading again.')
        return
      }
    }
    
    data.childrenInfo.forEach((child, index) => {
      if (child.photo) {
        if (!(child.photo instanceof File) || child.photo.size === 0) {
          setError(`Child photo ${index + 1} is invalid. Please try uploading again.`)
          return
        }
      }
    })
    
    setLoading(true)
    setError('')
    
    try {
      let formData = new FormData()
      
      const textData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: stripPhoneFormatting(data.phone),
        visitDate: data.visitDate,
        gatheringTime: data.gatheringTime,
        totalGuests: data.totalGuests,
        hasChildrenForFormationKids: data.hasChildrenForFormationKids,
        childrenInfo: data.childrenInfo.map(child => ({
          name: child.name,
          dob: child.dob,
          allergies: child.allergies || ''
        })),
        carType: data.carType,
        vehicleColor: data.vehicleColor || '',
        vehicleMake: data.vehicleMake || '',
        vehicleModel: data.vehicleModel || '',
        foodAllergies: data.foodAllergies || '',
        specialNeeds: data.specialNeeds || '',
        additionalNotes: data.additionalNotes || ''
      }
      
      formData.append('formData', JSON.stringify(textData))
      formData.append('cf-turnstile-response', turnstileToken)
      formData.append('profilePicture', data.profilePicture!)

      data.childrenInfo.forEach((child, index) => {
        if (child.photo) {
          formData.append(`childPhoto_${index}`, child.photo)
        }
      })

      const entriesCount = Array.from(formData.entries()).length
      if (entriesCount === 0) {
        throw new Error('FormData is empty before submission - this indicates a client-side issue')
      }

      let result = await submitGuestForm(formData)
      let retryCount = 0
      const maxRetries = 2
      
      while (!result.success && result.message?.includes('empty FormData') && retryCount < maxRetries) {
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const retryFormData = new FormData()
        retryFormData.append('formData', JSON.stringify(textData))
        retryFormData.append('profilePicture', data.profilePicture!)
        data.childrenInfo.forEach((child, index) => {
          if (child.photo) {
            retryFormData.append(`childPhoto_${index}`, child.photo)
          }
        })
        formData = retryFormData
        
        result = await submitGuestForm(formData)
      }

      if (!result.success) {
        throw new Error(result.message || 'Submission failed')
      }

      setSubmissionId(result.submissionId!)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setTurnstileToken('')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <GuestFormSubmitted submissionId={submissionId} />
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 relative">
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
            text="Friends of the House Registration"
            className="text-3xl text-gray-600 font-bold"
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

                  {/* Turnstile verification widget */}
                  <AnimatedSection delay={0.5}>
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY || ''}
                      onSuccess={(token) => setTurnstileToken(token)}
                      onError={() => setTurnstileToken('')}
                      onExpire={() => setTurnstileToken('')}
                      theme="auto"
                      size="normal"
                    />
                  </AnimatedSection>

                  <AnimatedSection delay={0.6}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-2xl py-8 border-2 border-red-800 shadow-lg text-[20px]"
                        disabled={loading || isAnyCompressing || !turnstileToken}
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block"
                          >
                            ⟳
                          </motion.div>
                        ) : isAnyCompressing ? (
                          'Compressing Images...'
                        ) : !turnstileToken ? (
                          'Complete Verification to Submit'
                        ) : (
                          'Submit Registration'
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
            2819 Church Friends of the House Registration System
          </p>
          <p className="text-lg text-red-600 mt-4 font-medium">
            Sharing this private link is prohibited and can prevent guests from being approved in the future.
          </p>
        </AnimatedSection>
      </div>
    </div>
  )
}

export function GuestForm() {
  return (
    <CompressionProvider>
      <GuestFormInner />
    </CompressionProvider>
  )
}
