import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { Calendar, Clock, Users, Car, Camera, Heart, MessageSquare, Baby } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { AnimatedText } from './AnimatedText'
import { AnimatedSection } from './AnimatedSection'
import { FloatingElements } from './FloatingElements'
import { motion } from 'motion/react'
import churchLogo from 'figma:asset/8a0d7e407ac0e2cb1219f412ca5d6c6eb8ea3b1c.png'

interface ChildInfo {
  name: string
  dob: string
  photo: File | null
  allergies: string
}



export function GuestForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [submissionId, setSubmissionId] = useState('')
  
  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [gatheringTime, setGatheringTime] = useState('')
  const [totalGuests, setTotalGuests] = useState('1')
  const [hasChildrenForFormationKids, setHasChildrenForFormationKids] = useState(false)
  const [childrenInfo, setChildrenInfo] = useState<ChildInfo[]>([])
  const [carType, setCarType] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [foodAllergies, setFoodAllergies] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [specialNeeds, setSpecialNeeds] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const addChild = () => {
    setChildrenInfo([...childrenInfo, { name: '', dob: '', photo: null, allergies: '' }])
  }

  const removeChild = (index: number) => {
    setChildrenInfo(childrenInfo.filter((_, i) => i !== index))
  }

  const updateChild = (index: number, field: keyof ChildInfo, value: string | File | null) => {
    const updated = [...childrenInfo]
    updated[index] = { ...updated[index], [field]: value }
    setChildrenInfo(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Validate required fields
      if (!firstName || !lastName || !email || !phone || !visitDate || !gatheringTime || !carType || !profilePicture) {
        throw new Error('Please fill in all required fields')
      }

      // Create form data
      const formData = new FormData()
      formData.append('firstName', firstName)
      formData.append('lastName', lastName)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('visitDate', visitDate)
      formData.append('gatheringTime', gatheringTime)
      formData.append('totalGuests', totalGuests)
      formData.append('hasChildrenForFormationKids', hasChildrenForFormationKids.toString())
      formData.append('childrenInfo', JSON.stringify(childrenInfo))
      formData.append('carType', carType)
      formData.append('vehicleColor', vehicleColor)
      formData.append('vehicleMake', vehicleMake)
      formData.append('vehicleModel', vehicleModel)
      formData.append('foodAllergies', foodAllergies)
      formData.append('profilePicture', profilePicture)
      formData.append('specialNeeds', specialNeeds)
      formData.append('additionalNotes', additionalNotes)

      // Add child photos
      childrenInfo.forEach((child, index) => {
        if (child.photo) {
          formData.append(`childPhoto_${index}`, child.photo)
        }
      })

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-66bf82e5/submit-guest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed')
      }

      setSubmissionId(data.submissionId)
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
              <motion.img 
                src={churchLogo} 
                alt="2819 Church Logo" 
                className="h-20 w-auto mx-auto mb-6 filter brightness-0 invert"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
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
          <motion.img 
            src={churchLogo} 
            alt="2819 Church Logo" 
            className="h-24 w-auto mx-auto mb-6"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
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
            <Alert className="border-2 border-red-600 bg-red-50">
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
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Personal Information */}
              <AnimatedSection delay={0.1} className="space-y-6">
                <h3 className="text-3xl font-bold text-black border-b-2 border-red-600 pb-3">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-xl">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="border-2 border-gray-300 focus:border-red-600 py-4"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-xl">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="border-2 border-gray-300 focus:border-red-600 py-4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-xl">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-2 border-gray-300 focus:border-red-600 py-4"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-xl">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="border-2 border-gray-300 focus:border-red-600 py-4"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="profilePicture" className="text-xl">Profile Picture *</Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                    required
                    className="border-2 border-gray-300 focus:border-red-600 h-auto py-3 px-3 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-sm file:font-medium hover:file:bg-red-700 file:cursor-pointer"
                  />
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
                    <Input
                      id="visitDate"
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      required
                      className="border-2 border-gray-300 focus:border-red-600 py-2 mr-6 w-auto max-w-[250px]"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="gatheringTime" className="text-xl">Gathering Time *</Label>
                    <Select value={gatheringTime} onValueChange={setGatheringTime} required>
                      <SelectTrigger className="border-2 border-gray-300 focus:border-red-600 py-4 text-xl">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10:00 AM" className="text-xl">08:00 AM</SelectItem>
                        <SelectItem value="12:00 PM" className="text-xl">10:30 PM</SelectItem>
                        <SelectItem value="6:00 PM" className="text-xl">1:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="totalGuests" className="text-xl">Total Number of Guests</Label>
                  <Select value={totalGuests} onValueChange={setTotalGuests}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-red-600 py-4 text-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <SelectItem key={num} value={num.toString()} className="text-xl">{num}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </AnimatedSection>

              {/* Children Information */}
              <AnimatedSection delay={0.3} className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    id="hasChildren"
                    checked={hasChildrenForFormationKids}
                    onCheckedChange={setHasChildrenForFormationKids}
                    className="w-6 h-6"
                  />
                  <Label htmlFor="hasChildren" className="text-2xl font-bold text-black flex items-center gap-3">
                    <Baby className="h-8 w-8 text-red-600" />
                    I want my child to attend Formation Kids
                  </Label>
                </div>

                {hasChildrenForFormationKids && (
                  <motion.div 
                    className="space-y-6 pl-8 border-l-4 border-red-600"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.5 }}
                  >

                    {/* Children */}
                    {childrenInfo.map((child, index) => (
                      <motion.div 
                        key={index} 
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
                            <Input
                              placeholder="Child's full name"
                              value={child.name}
                              onChange={(e) => updateChild(index, 'name', e.target.value)}
                              className="border-2 border-gray-300 focus:border-red-600 py-4"
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xl">Child's Date of Birth *</Label>
                            <Input
                              type="date"
                              value={child.dob}
                              onChange={(e) => updateChild(index, 'dob', e.target.value)}
                              className="border-2 border-gray-300 focus:border-red-600 py-4"
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xl">Photo of Child *</Label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => updateChild(index, 'photo', e.target.files?.[0] || null)}
                              className="border-2 border-gray-300 focus:border-red-600 py-4"
                            />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-xl">Allergies</Label>
                            <Textarea
                              placeholder="List any allergies or special dietary needs..."
                              value={child.allergies}
                              onChange={(e) => updateChild(index, 'allergies', e.target.value)}
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
                  <Select value={carType} onValueChange={setCarType} required>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-red-600 py-4 text-xl">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="vehicleMake" className="text-xl">Make</Label>
                    <Input
                      id="vehicleMake"
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      placeholder="e.g., Toyota"
                      className="border-2 border-gray-300 focus:border-red-600 py-4"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="vehicleModel" className="text-xl">Model</Label>
                    <Input
                      id="vehicleModel"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g., Camry"
                      className="border-2 border-gray-300 focus:border-red-600 py-4"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="vehicleColor" className="text-xl">Color</Label>
                    <Input
                      id="vehicleColor"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
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
                    value={foodAllergies}
                    onChange={(e) => setFoodAllergies(e.target.value)}
                    placeholder="Please list any food allergies or dietary restrictions..."
                    className="border-2 border-gray-300 focus:border-red-600 min-h-[120px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="specialNeeds" className="text-xl">Special Needs or Accommodations</Label>
                  <Textarea
                    id="specialNeeds"
                    value={specialNeeds}
                    onChange={(e) => setSpecialNeeds(e.target.value)}
                    placeholder="Please describe any special needs or accommodations..."
                    className="border-2 border-gray-300 focus:border-red-600 min-h-[120px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="additionalNotes" className="text-xl">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
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
        </AnimatedSection>
      </div>
    </div>
  )
}