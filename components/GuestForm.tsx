'use client'

import { useState } from 'react'
import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Textarea } from './ui/textarea'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Calendar, Car, Heart, Baby, Search, AlertCircle } from 'lucide-react'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { FloatingElements } from './FloatingElements'
import { submitGuestForm } from '@/lib/actions'
import { guestFormSchema, GuestFormData } from '@/lib/types'

// Form field error tooltip component with motion animations
const FormFieldError = ({ message }: { message: string }) => {
  return (
    <motion.div 
      className="absolute left-0 top-full w-full"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{ pointerEvents: 'none', marginTop: '5px' }}
    >
      <div className="relative flex justify-center">
        <motion.div 
          className="z-50 bg-white border border-orange-300 rounded-md px-3 py-2 shadow-md text-sm w-max max-w-[250px]"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(255, 255, 255, 0.98)' }}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-t border-orange-300 rotate-45" style={{ backgroundColor: 'rgba(255, 255, 255, 0.98)' }}></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-500 flex-shrink-0">
              <AlertCircle className="h-4 w-4" />
            </div>
            <span className="text-gray-700">{message}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export function GuestForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [submissionId, setSubmissionId] = useState('')
  
  // Initialize React Hook Form with proper typing
  const { 
    register, 
    control, 
    handleSubmit, 
    watch, 
    formState: { errors, touchedFields }, 
    setValue,
    getValues
  } = useForm({
    resolver: zodResolver(guestFormSchema),
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
  
  // Use useFieldArray for dynamic children fields
  const { fields, append: appendChild, remove: removeChild } = useFieldArray({
    control,
    name: "childrenInfo"
  });
  
  // Watch for changes in hasChildrenForFormationKids
  const hasChildren = watch('hasChildrenForFormationKids');
  
  // Helper functions for children management
  const addChild = () => {
    // Using null as a placeholder - the user will need to select a file
    // The validation will catch this and show an error until a file is selected
    appendChild({ name: '', dob: '', photo: undefined, allergies: '' });
  };

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

      setSubmissionId(result.submissionId)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <FloatingElements />
        <AnimatedSection className="w-full max-w-md">
          <Card className="border-2 border-black shadow-2xl">
            <CardHeader className="text-center bg-black text-white">
              <motion.div
                className="relative h-20 w-auto mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Image 
                  src="/church-logo.png"
                  alt="Church Logo" 
                  fill
                  style={{ objectFit: 'contain' }}
                  className="filter brightness-0 invert"
                />
              </motion.div>
              <AnimatedText 
                text="Registration Submitted!"
                className="text-2xl font-bold text-red-600"
              />
            </CardHeader>
            <CardContent className="text-center space-y-6 p-8">
              <AnimatedSection delay={0.3}>
                <p className="text-black text-xl">
                  Thank you for your guest registration. You will receive a notification once your request is reviewed.
                </p>
              </AnimatedSection>
              <AnimatedSection delay={0.4}>
                <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
                  <p className="text-lg text-gray-700 mb-2">Submission ID:</p>
                  <p className="font-mono text-lg font-bold text-black">{submissionId}</p>
                </div>
              </AnimatedSection>
              <AnimatedSection delay={0.5}>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-6"
                >
                  Submit Another Registration
                </Button>
              </AnimatedSection>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    )
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
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                {/* Personal Information */}
                <AnimatedSection delay={0.1} className="space-y-6">
                  <h3 className="text-3xl font-bold text-black border-b-2 border-red-600 pb-3">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="firstName" className="text-xl">First Name *</Label>
                      <div className="relative">
                        <Input
                          id="firstName"
                          {...register('firstName')}
                          className={`border-2 ${errors.firstName ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                        />
                        {errors.firstName && <FormFieldError message={errors.firstName.message || 'First name is required'} />}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="lastName" className="text-xl">Last Name *</Label>
                      <div className="relative">
                        <Input
                          id="lastName"
                          {...register('lastName')}
                          className={`border-2 ${errors.lastName ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                        />
                        {errors.lastName && <FormFieldError message={errors.lastName.message || 'Last name is required'} />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-xl">Email *</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          className={`border-2 ${errors.email ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                        />
                        {errors.email && <FormFieldError message={errors.email.message || 'Valid email is required'} />}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-xl">Phone Number *</Label>
                      <div className="relative" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <Input
                            id="phone"
                            type="tel"
                            {...register('phone')}
                            className={`border-2 ${errors.phone ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4 w-full`}
                          />
                          {errors.phone && <FormFieldError message={errors.phone.message || 'Phone number must be exactly 10 digits'} />}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="profilePicture" className="text-xl">Profile Picture *</Label>
                    <div className="relative" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <Controller
                          name="profilePicture"
                          control={control}
                          render={({ field: { onChange, value, ...field } }) => (
                            <Input
                              id="profilePicture"
                              type="file"
                              accept="image/*"
                              onChange={(e) => onChange(e.target.files?.[0] || null)}
                              className={`border-2 ${errors.profilePicture ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} h-auto py-3 px-3 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-sm file:font-medium hover:file:bg-red-700 file:cursor-pointer w-full`}
                              {...field}
                            />
                          )}
                        />
                        {errors.profilePicture && <FormFieldError message={errors.profilePicture.message || 'Profile picture is required'} />}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                {/* Visit Details */}
                <AnimatedSection delay={0.2} className="space-y-6">
                  <h3 className="text-3xl font-bold text-black border-b-2 border-red-600 pb-3 flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-red-600" />
                    Visit Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="visitDate" className="text-xl">Visit Date *</Label>
                      <div className="relative" style={{ maxWidth: '250px' }}>
                        <Input
                          id="visitDate"
                          type="date"
                          {...register('visitDate')}
                          className={`border-2 ${errors.visitDate ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-2 w-full`}
                        />
                        {errors.visitDate && <FormFieldError message={errors.visitDate.message || 'Visit date is required'} />}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="gatheringTime" className="text-xl">Gathering Time *</Label>
                      <div className="relative" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="relative" style={{ width: '100%' }}>
                          <Controller
                            name="gatheringTime"
                            control={control}
                            render={({ field }) => (
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <SelectTrigger 
                                  className={`border-2 ${errors.gatheringTime ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4 text-xl`}
                                >
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="08:00 AM" className="text-xl">08:00 AM</SelectItem>
                                  <SelectItem value="10:30 AM" className="text-xl">10:30 AM</SelectItem>
                                  <SelectItem value="01:00 PM" className="text-xl">01:00 PM</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.gatheringTime && <FormFieldError message={errors.gatheringTime.message || 'Gathering time is required'} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="totalGuests" className="text-xl">Total Number of Guests</Label>
                    <Controller
                      name="totalGuests"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="border-2 border-gray-300 focus:border-red-600 py-4 text-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8,9,10].map(num => (
                              <SelectItem key={num} value={num.toString()} className="text-xl">{num}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </AnimatedSection>

                {/* Children Information */}
                <AnimatedSection delay={0.3} className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Controller
                      name="hasChildrenForFormationKids"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="hasChildren"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="w-6 h-6"
                        />
                      )}
                    />
                    <Label htmlFor="hasChildren" className="text-2xl font-bold text-black flex items-center gap-3">
                      <Baby className="h-8 w-8 text-red-600" />
                      I want my child to attend Formation Kids
                    </Label>
                  </div>

                  {hasChildren && (
                    <motion.div 
                      className="space-y-6 pl-8 border-l-4 border-red-600"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.5 }}
                    >
                      {fields.map((field, index) => (
                        <motion.div 
                          key={field.id} 
                          className="p-6 bg-gray-50 rounded-lg border-2 border-gray-300 space-y-6"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="text-2xl font-bold text-black">Child {index + 1}</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => removeChild(index)}
                              className="border-red-600 text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label className="text-xl">Child's Name *</Label>
                              <div className="relative" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                  <Input
                                  placeholder="Child's full name"
                                  {...register(`childrenInfo.${index}.name`)}
                                  className={`border-2 ${errors.childrenInfo?.[index]?.name ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                                />
                                {errors.childrenInfo?.[index]?.name && (
                                  <FormFieldError message={errors.childrenInfo[index].name?.message || 'Child name is required'} />
                                )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-xl">Child's Date of Birth *</Label>
                              <div className="relative" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                  <Input
                                  type="date"
                                  {...register(`childrenInfo.${index}.dob`)}
                                  className={`border-2 ${errors.childrenInfo?.[index]?.dob ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                                />
                                {errors.childrenInfo?.[index]?.dob && (
                                  <FormFieldError message={errors.childrenInfo[index].dob?.message || 'Valid date of birth is required'} />
                                )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-xl">Photo of Child *</Label>
                              <div className="relative" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'relative', width: '100%' }}>
                                  <Controller
                                  name={`childrenInfo.${index}.photo`}
                                  control={control}
                                  render={({ field: { onChange, value, ...field } }) => (
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => onChange(e.target.files?.[0] || null)}
                                      className={`border-2 ${errors.childrenInfo?.[index]?.photo ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                                      {...field}
                                    />
                                  )}
                                />
                                {errors.childrenInfo?.[index]?.photo && (
                                  <FormFieldError message={errors.childrenInfo[index].photo?.message || 'Child photo is required'} />
                                )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-xl">Allergies</Label>
                              <Textarea
                                placeholder="List any allergies or special dietary needs..."
                                {...register(`childrenInfo.${index}.allergies`)}
                                className="border-2 border-gray-300 focus:border-red-600 min-h-[100px]"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addChild}
                        className="w-full py-6 text-xl border-2 border-red-600 text-red-600 hover:bg-red-50"
                      >
                        Add Child
                      </Button>
                    </motion.div>
                  )}
                </AnimatedSection>

                {/* Vehicle Information */}
                <AnimatedSection delay={0.4} className="space-y-6">
                  <h3 className="text-3xl font-bold text-black border-b-2 border-red-600 pb-3 flex items-center gap-3">
                    <Car className="h-8 w-8 text-red-600" />
                    Vehicle Information
                  </h3>
                  
                  <div className="space-y-3">
                    <Label htmlFor="carType" className="text-xl">Vehicle Type *</Label>
                    <div className="relative" style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <Controller
                          name="carType"
                          control={control}
                          render={({ field }) => (
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger 
                                className={`border-2 ${errors.carType ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4 text-xl`}
                              >
                                <SelectValue placeholder="Select vehicle type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Sedan" className="text-xl">Sedan</SelectItem>
                                <SelectItem value="SUV" className="text-xl">SUV</SelectItem>
                                <SelectItem value="Truck" className="text-xl">Truck</SelectItem>
                                <SelectItem value="Van" className="text-xl">Van</SelectItem>
                                <SelectItem value="Coupe" className="text-xl">Coupe</SelectItem>
                                <SelectItem value="Hatchback" className="text-xl">Hatchback</SelectItem>
                                <SelectItem value="Other" className="text-xl">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.carType && <FormFieldError message={errors.carType.message || 'Vehicle type is required'} />}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="vehicleMake" className="text-xl">Make</Label>
                      <Input
                        id="vehicleMake"
                        {...register('vehicleMake')}
                        placeholder="e.g., Toyota"
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="vehicleModel" className="text-xl">Model</Label>
                      <Input
                        id="vehicleModel"
                        {...register('vehicleModel')}
                        placeholder="e.g., Camry"
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="vehicleColor" className="text-xl">Color</Label>
                      <Input
                        id="vehicleColor"
                        {...register('vehicleColor')}
                        placeholder="e.g., Blue"
                        className="border-2 border-gray-300 focus:border-red-600 py-4"
                      />
                    </div>
                  </div>
                </AnimatedSection>

                {/* Additional Information */}
                <AnimatedSection delay={0.5} className="space-y-6">
                  <h3 className="text-3xl font-bold text-black border-b-2 border-red-600 pb-3 flex items-center gap-3">
                    <Heart className="h-8 w-8 text-red-600" />
                    Additional Information
                  </h3>
                  
                  <div className="space-y-3">
                    <Label htmlFor="foodAllergies" className="text-xl">Food Allergies or Dietary Restrictions</Label>
                    <Textarea
                      id="foodAllergies"
                      {...register('foodAllergies')}
                      placeholder="Please list any food allergies or dietary restrictions..."
                      className="border-2 border-gray-300 focus:border-red-600 min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="specialNeeds" className="text-xl">Special Needs or Accommodations</Label>
                    <Textarea
                      id="specialNeeds"
                      {...register('specialNeeds')}
                      placeholder="Please describe any special needs or accommodations..."
                      className="border-2 border-gray-300 focus:border-red-600 min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="additionalNotes" className="text-xl">Additional Notes</Label>
                    <Textarea
                      id="additionalNotes"
                      {...register('additionalNotes')}
                      placeholder="Any additional information you'd like to share..."
                      className="border-2 border-gray-300 focus:border-red-600 min-h-[120px]"
                    />
                  </div>
                </AnimatedSection>

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

