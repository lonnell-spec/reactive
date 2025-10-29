import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { AnimatedSection } from '../../AnimatedSection';
import { FormFieldError } from '../FormFieldError';
import { GuestFormData } from '@/lib/types';
import { Car } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

/**
 * Vehicle Information section of the guest form
 */
export const VehicleInformationSection = () => {
  const { register, control, formState: { errors } } = useFormContext<GuestFormData>();
  return (
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
  );
};

export default VehicleInformationSection;
