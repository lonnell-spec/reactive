import { Controller, useFormContext, useFieldArray } from 'react-hook-form';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { AnimatedSection } from '../../AnimatedSection';
import { FormFieldError } from '../FormFieldError';
import { GuestFormData } from '@/lib/types';
import { Baby } from 'lucide-react';
import { Checkbox } from '../../ui/checkbox';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { motion } from 'motion/react';
import { compressChildPhoto, validateFileForCompression, formatFileSize } from '@/lib/image-compression-utils';
import { useState } from 'react';
import { useCompression } from '../CompressionContext';

/**
 * Children Information section of the guest form
 */
export const ChildrenInformationSection = () => {
  const { register, control, formState: { errors }, watch } = useFormContext<GuestFormData>();
  const { fields, remove, append } = useFieldArray({
    control,
    name: "childrenInfo"
  });
  
  const hasChildren = watch("hasChildrenForFormationKids");
  const { setChildCompressing } = useCompression();
  const [compressionStates, setCompressionStates] = useState<{[key: number]: { isCompressing: boolean; status: string }}>({});
  
  // Helper function to add a child
  const addChild = () => {
    // Using null as a placeholder - the user will need to select a file
    // The validation will catch this and show an error until a file is selected
    append({ name: '', dob: '', photo: null as unknown as File, allergies: '' });
  };

  return (
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
                  onClick={() => remove(index)}
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
                          disabled={compressionStates[index]?.isCompressing}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) {
                              onChange(null);
                              setCompressionStates(prev => ({
                                ...prev,
                                [index]: { isCompressing: false, status: '' }
                              }));
                              return;
                            }

                            try {
                              // Validate file before compression
                              validateFileForCompression(file, 10); // Max 10MB before compression
                              
                              setCompressionStates(prev => ({
                                ...prev,
                                [index]: { 
                                  isCompressing: true, 
                                  status: `Compressing ${file.name} (${formatFileSize(file.size)})...` 
                                }
                              }));
                              setChildCompressing(index, true);
                              
                              // Compress the image
                              const compressedFile = await compressChildPhoto(file);
                              
                              setCompressionStates(prev => ({
                                ...prev,
                                [index]: { 
                                  isCompressing: false, 
                                  status: `Compressed to ${formatFileSize(compressedFile.size)} ✓` 
                                }
                              }));
                              setChildCompressing(index, false);
                              onChange(compressedFile);
                              
                              // Clear status after 3 seconds
                              setTimeout(() => {
                                setCompressionStates(prev => ({
                                  ...prev,
                                  [index]: { isCompressing: false, status: '' }
                                }));
                              }, 3000);
                            } catch (error) {
                              console.error('Compression failed:', error);
                              setCompressionStates(prev => ({
                                ...prev,
                                [index]: { 
                                  isCompressing: false, 
                                  status: `Error: ${error instanceof Error ? error.message : 'Compression failed'}` 
                                }
                              }));
                              setChildCompressing(index, false);
                              onChange(null);
                              // Clear input
                              e.target.value = '';
                            }
                          }}
                          className={`border-2 ${errors.childrenInfo?.[index]?.photo ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} h-auto py-3 px-3 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-sm file:font-medium hover:file:bg-red-700 file:cursor-pointer w-full ${compressionStates[index]?.isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          {...field}
                        />
                      )}
                    />
                    {compressionStates[index]?.status && (
                      <div className={`text-sm mt-2 ${compressionStates[index].status.includes('Error') ? 'text-red-600' : compressionStates[index].status.includes('✓') ? 'text-green-600' : 'text-blue-600'}`}>
                        {compressionStates[index].status}
                      </div>
                    )}
                    {errors.childrenInfo?.[index]?.photo && (
                      <FormFieldError message={errors.childrenInfo[index].photo?.message || 'Child photo is required'} />
                    )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Images will be automatically compressed. Max 10MB before compression.
                  </p>
                </div>
                <div className="space-y-3">
                  <Label className="text-xl">Allergies *</Label>
                  <div className="relative" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <Textarea
                        placeholder="List any allergies or special dietary needs..."
                        {...register(`childrenInfo.${index}.allergies`)}
                        className={`border-2 ${errors.childrenInfo?.[index]?.allergies ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-red-600'} min-h-[100px]`}
                      />
                      {errors.childrenInfo?.[index]?.allergies && (
                        <FormFieldError message={errors.childrenInfo[index].allergies?.message || 'Allergies information is required'} />
                      )}
                    </div>
                  </div>
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
  );
};

export default ChildrenInformationSection;
