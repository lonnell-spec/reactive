import { PostgrestError } from '@supabase/supabase-js';
import { z } from 'zod';

// File validation that works in both browser and Node environments
export const fileValidation = z.custom<File | undefined>(
  (val: unknown) => {
    // In browser: check if it's a File instance
    if (typeof File !== 'undefined' && val instanceof File) {
      return true;
    }
    
    // In Node/server: check if it has the necessary File-like properties
    if (
      val && 
      typeof val === 'object' && 
      'name' in val && 
      'size' in val && 
      'type' in val
    ) {
      return true;
    }
    
    return false;
  }, 
  { message: 'Expected a file upload' }
);

// Image file validation with size and type checks (after client-side compression)
export const imageFileValidation = fileValidation
  .refine(file => file && file.size < 1.2 * 1024 * 1024, { 
    message: 'Compressed file must be less than 1.2MB' 
  })
  .refine(file => file && file.type.startsWith('image/'), { 
    message: 'File must be an image' 
  });

// Child information schema
export const childInfoSchema = z.object({
  name: z.string().min(1, 'Child name is required'),
  dob: z.string().min(1, 'Date of birth is required')
    .refine(val => {
      const date = new Date(val);
      const now = new Date();
      return date <= now;
    }, { message: 'Date of birth cannot be in the future' }),
  allergies: z.string()
    .min(1, 'Allergies information is required')
    .refine(val => val.trim().length > 0, {
      message: 'Allergies information cannot be empty'
    }),
  photo: imageFileValidation
});

export type ChildInfo = z.infer<typeof childInfoSchema>;
export type ChildInfoNoPhoto = Omit<ChildInfo, 'photo'>;

// Guest form schema
export const guestFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email address'),
  phone: z.string()
    .transform(val => val.replace(/\D/g, '')) // Strip all non-digits
    .refine(val => val.length === 10, 'Phone number must be exactly 10 digits'),
  visitDate: z.string()
    .min(1, 'Visit date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Visit date must be in YYYY-MM-DD format'),
  gatheringTime: z.string().min(1, 'Gathering time is required'),
  totalGuests: z.string().min(1, 'Number of guests is required'),
  hasChildrenForFormationKids: z.boolean().default(false),
  childrenInfo: z.array(childInfoSchema).default([]),
  carType: z.string().min(1, 'Vehicle type is required'),
  vehicleColor: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  foodAllergies: z.string().optional(),
  specialNeeds: z.string().optional(),
  additionalNotes: z.string().optional(),
  profilePicture: imageFileValidation
});

export type GuestFormData = z.infer<typeof guestFormSchema>;

// Server-side file validation - kept for backward compatibility
export const fileSchema = z.object({
  name: z.string(),
  size: z.number().positive(),
  type: z.string().startsWith('image/'),
});

// Enum for guest status
export enum GuestStatus {
  PENDING_PRE_APPROVAL = 'pending_pre_approval',
  PRE_APPROVAL_DENIED = 'pre_approval_denied',
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied'
}

export type GuestInsertResult =  {
  id: string;
  external_guest_id: string;
}

export type Cleanup = {
  guestId: string | null;
  childrenIds: string[];
  uploadedFiles: string[];
}