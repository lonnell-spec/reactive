import { useFormContext } from 'react-hook-form';
import { Label } from '../../ui/label';
import { AnimatedSection } from '../../AnimatedSection';
import { GuestFormData } from '@/lib/types';
import { Heart } from 'lucide-react';
import { Textarea } from '../../ui/textarea';

/**
 * Additional Information section of the guest form
 */
export const AdditionalInformationSection = () => {
  const { register } = useFormContext<GuestFormData>();
  return (
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
  );
};

export default AdditionalInformationSection;
