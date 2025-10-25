import { z } from 'zod';

// Child information schema
export const childInfoSchema = z.object({
  name: z.string().min(1, 'Child name is required'),
  dob: z.string().optional(),
  allergies: z.string().optional(),
  photo: z.any().optional() // We'll handle file validation separately
});

export type ChildInfo = z.infer<typeof childInfoSchema>;

// Guest form schema
export const guestFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  visitDate: z.string().min(1, 'Visit date is required'),
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
  profilePicture: z.any() // We'll handle file validation separately
});

export type GuestFormData = z.infer<typeof guestFormSchema>;

// Server-side file validation
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
