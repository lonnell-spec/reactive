import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '../../ui/input';
import { PhoneInput } from '../../ui/phone-input';
import { Label } from '../../ui/label';
import { AnimatedSection } from '../../AnimatedSection';
import { FormFieldError } from '../FormFieldError';
import { GuestFormData } from '@/lib/types';
import { compressProfilePhotoHighQuality, validateFileForCompression, formatFileSize } from '@/lib/image-compression-utils';
import { useState } from 'react';
import { useCompression } from '../CompressionContext';

/**
 * Personal Information section of the guest form
 */
export const PersonalInformationSection = () => {
  const { register, control, formState: { errors } } = useFormContext<GuestFormData>();
  const { setProfileCompressing } = useCompression();
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState<string>('');
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
          <div className="relative">
            <Controller
              name="phone"
              control={control}
              defaultValue=""
              render={({ field: { onChange, value, name, ref } }) => (
                <PhoneInput
                  id="phone"
                  name={name}
                  ref={ref}
                  value={value || ''}
                  onChange={onChange}
                  className={`border-2 ${errors.phone ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} py-4`}
                />
              )}
            />
            {errors.phone && <FormFieldError message={errors.phone.message || 'Phone number must be exactly 10 digits'} />}
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
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
                  disabled={isCompressing}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      onChange(null);
                      setCompressionStatus('');
                      return;
                    }

                    try {
                      // Validate file before compression
                      validateFileForCompression(file, 10); // Max 10MB before compression
                      
                      setIsCompressing(true);
                      setProfileCompressing(true);
                      setCompressionStatus(`Compressing ${file.name} (${formatFileSize(file.size)})...`);
                      
                      // Compress the image with high quality for admin display
                      const compressedFile = await compressProfilePhotoHighQuality(file);
                      
                      setCompressionStatus(`Compressed to ${formatFileSize(compressedFile.size)} ✓`);
                      onChange(compressedFile);
                      
                      // Clear status after 3 seconds
                      setTimeout(() => setCompressionStatus(''), 3000);
                    } catch (error) {
                      setCompressionStatus(`Error: ${error instanceof Error ? error.message : 'Compression failed'}`);
                      onChange(null);
                      // Clear input
                      e.target.value = '';
                    } finally {
                      setIsCompressing(false);
                      setProfileCompressing(false);
                    }
                  }}
                  className={`border-2 ${errors.profilePicture ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} h-auto py-3 px-3 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-sm file:font-medium hover:file:bg-red-700 file:cursor-pointer w-full ${isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  {...field}
                />
              )}
            />
            {compressionStatus && (
              <div className={`text-sm mt-2 ${compressionStatus.includes('Error') ? 'text-red-600' : compressionStatus.includes('✓') ? 'text-green-600' : 'text-blue-600'}`}>
                {compressionStatus}
              </div>
            )}
            {errors.profilePicture && <FormFieldError message={errors.profilePicture.message || 'Profile picture is required'} />}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Images will be automatically compressed to reduce file size. Maximum 10MB before compression.
        </p>
      </div>
    </AnimatedSection>
  );
};

export default PersonalInformationSection;
