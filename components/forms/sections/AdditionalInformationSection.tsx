import { useFormContext } from 'react-hook-form';
import { Label } from '../../ui/label';
import { AnimatedSection } from '../../AnimatedSection';
import { GuestFormData } from '@/lib/types';
import { Heart, ShoppingBag } from 'lucide-react';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';
import { Checkbox } from '../../ui/checkbox';

/**
 * Additional Information section of the guest form
 */
export const AdditionalInformationSection = () => {
  const { register, watch, setValue } = useFormContext<GuestFormData>();
  const attendingMerch = watch('attendingMerch');

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

      {/* Merch shop interest -------------------------------------------------- */}
      <div className="space-y-4 pt-2 border-t-2 border-gray-100">
        <h4 className="text-2xl font-bold text-black flex items-center gap-3">
          <ShoppingBag className="h-7 w-7 text-red-600" />
          Merch Shop
        </h4>

        <div className="flex items-start gap-3">
          <Checkbox
            id="attendingMerch"
            checked={attendingMerch === true}
            onCheckedChange={(checked) => setValue('attendingMerch', checked === true)}
            className="mt-1"
          />
          <Label htmlFor="attendingMerch" className="text-xl cursor-pointer leading-relaxed">
            Do you want to visit our merch shop?
          </Label>
        </div>

        {attendingMerch && (
          <div className="space-y-3 pl-8">
            <Label htmlFor="merchSize" className="text-xl">What size do you wear?</Label>
            <Input
              id="merchSize"
              type="text"
              {...register('merchSize')}
              placeholder="e.g. M, Large, XL men's, size 10..."
              className="border-2 border-gray-300 focus:border-red-600"
            />
          </div>
        )}
      </div>
    </AnimatedSection>
  );
};

export default AdditionalInformationSection;
