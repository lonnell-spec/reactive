import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { AnimatedSection } from '../../AnimatedSection';
import { FormFieldError } from '../FormFieldError';
import { GuestFormData } from '@/lib/types';

/**
 * Personal Information section of the guest form
 */
export const PersonalInformationSection = () => {
  const { register, control, formState: { errors } } = useFormContext<GuestFormData>();
  return (
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
  );
};

export default PersonalInformationSection;
