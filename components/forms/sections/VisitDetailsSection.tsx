import { Controller, useFormContext } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { AnimatedSection } from '../../AnimatedSection';
import { FormFieldError } from '../FormFieldError';
import { GuestFormData } from '@/lib/types';
import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { MultiSelectCommaSeparatedDropdown } from '../../ui/multi-select-comma-separated-dropdown';

// Available gathering time options
const GATHERING_TIMES = ['08:00 AM', '10:30 AM', '01:00 PM', '07:00 PM'];

/**
 * Visit Details section of the guest form
 */
export const VisitDetailsSection = () => {
  const { register, control, formState: { errors } } = useFormContext<GuestFormData>();
  return (
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
            <Controller
              name="gatheringTime"
              control={control}
              render={({ field }) => (
                <MultiSelectCommaSeparatedDropdown
                  value={field.value || ''}
                  onChange={field.onChange}
                  options={GATHERING_TIMES}
                  error={!!errors.gatheringTime}
                  placeholder="Select time(s)"
                />
              )}
            />
            {errors.gatheringTime && <FormFieldError message={errors.gatheringTime.message || 'Gathering time is required'} />}
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
  );
};

export default VisitDetailsSection;
