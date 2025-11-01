'use server'

import { GuestFormData, GuestStatus } from './types';
import { generateCodeWord } from './guest-credentials';

/**
 * Maps form data to database guest record
 * Pure function for testability
 * 
 * @param parsedData Form data to map
 * @param credentialId Optional credential ID (generates UUID if not provided)
 * @param codeWord Optional code word (generates if not provided)
 * @param qrExpiry Optional QR expiry date (generates if not provided)
 * @returns Database record object
 */
export async function mapFormDataToGuestRecord(
  parsedData: GuestFormData,
  credentialId?: string,
  codeWord?: string,
  qrExpiry?: string
): Promise<any> {
  return {
    first_name: parsedData.firstName,
    last_name: parsedData.lastName,
    email: parsedData.email,
    phone: parsedData.phone,
    visit_date: parsedData.visitDate,
    gathering_time: parsedData.gatheringTime,
    total_guests: parsedData.totalGuests,
    should_enroll_children: parsedData.hasChildrenForFormationKids,
    vehicle_type: parsedData.carType,
    vehicle_color: parsedData.vehicleColor,
    vehicle_make: parsedData.vehicleMake,
    vehicle_model: parsedData.vehicleModel,
    food_allergies: parsedData.foodAllergies,
    special_needs: parsedData.specialNeeds,
    additional_notes: parsedData.additionalNotes,
    status: GuestStatus.PENDING_PRE_APPROVAL,
    credential_id: credentialId || crypto.randomUUID(),
    code_word: codeWord || await generateCodeWord(),
    qr_expiry: qrExpiry || await generateQRExpiry()
  };
}

/**
 * Generates QR code expiry date
 * Pure function for testability
 * 
 * @param daysFromNow Number of days from now (default: 30)
 * @param dateProvider Function to get current date (for testing)
 * @returns ISO string of expiry date
 */
export async function generateQRExpiry(
  daysFromNow: number = 30,
  dateProvider: () => Date = () => new Date()
): Promise<string> {
  if (daysFromNow <= 0) {
    throw new Error('Days from now must be positive');
  }
  
  const now = dateProvider();
  const expiryDate = new Date(now.getTime());
  expiryDate.setDate(expiryDate.getDate() + daysFromNow);
  return expiryDate.toISOString();
}

/**
 * Maps child info to database child record
 * Pure function for testability
 * 
 * @param child Child information
 * @param guestId Guest ID to associate with
 * @returns Database child record object
 */
export async function mapChildInfoToRecord(
  child: { name: string; dob: string; allergies?: string },
  guestId: string
): Promise<any> {
  if (!guestId) {
    throw new Error('Guest ID is required');
  }
  
  return {
    guest_id: guestId,
    name: child.name,
    dob: child.dob,
    allergies: child.allergies || ''
  };
}

/**
 * Creates guest update record for profile picture
 * Pure function for testability
 * 
 * @param profilePath Storage path of profile picture
 * @returns Database update object
 */
export async function createGuestProfileUpdateRecord(
  profilePath: string
): Promise<{ photo_path: string }> {
  if (!profilePath) {
    throw new Error('Profile path is required');
  }
  
  return {
    photo_path: profilePath
  };
}

/**
 * Creates child update record for photo path
 * Pure function for testability
 * 
 * @param photoPath Storage path of child photo
 * @returns Database update object
 */
export async function createChildPhotoUpdateRecord(
  photoPath: string
): Promise<{ photo_path: string }> {
  if (!photoPath) {
    throw new Error('Photo path is required');
  }
  
  return {
    photo_path: photoPath
  };
}

