'use client'

/**
 * Submission interface for formatted guest data
 */
export interface Submission {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visitDate: string;
  gatheringTime: string;
  totalGuests: number;
  hasChildrenForFormationKids: boolean;
  childrenInfo: Array<{
    id: string;
    name: string;
    dob: string;
    allergies: string;
    photo_path: string;
  }>;
  carType: string;
  vehicleColor: string;
  vehicleMake: string;
  vehicleModel: string;
  foodAllergies: string;
  specialNeeds: string;
  additionalNotes: string;
  status: string;
  profilePicture: string;
  submittedAt: string;
  preApprovedBy?: string;
  preApprovedAt?: string;
  preApprovalDeniedBy?: string;
  preApprovalDeniedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  deniedBy?: string;
  deniedAt?: string;
}

/**
 * Formats raw guest data from database into submission format
 * Pure function for testability
 * 
 * @param guest Raw guest data from database
 * @returns Formatted submission object
 */
export async function formatGuestData(guest: any): Promise<Submission> {
  if (!guest) {
    throw new Error('Guest data is required');
  }

  return {
    id: guest.id,
    firstName: guest.first_name || '',
    lastName: guest.last_name || '',
    email: guest.email || '',
    phone: guest.phone || '',
    visitDate: guest.visit_date || '',
    gatheringTime: guest.gathering_time || '',
    totalGuests: guest.total_guests || 0,
    hasChildrenForFormationKids: Boolean(guest.should_enroll_children),
    childrenInfo: (guest.guest_children || []).map((child: any) => ({
      id: child.id,
      name: child.name || '',
      dob: child.dob || '',
      allergies: child.allergies || '',
      photo_path: child.photo_path || ''
    })),
    carType: guest.vehicle_type || '',
    vehicleColor: guest.vehicle_color || '',
    vehicleMake: guest.vehicle_make || '',
    vehicleModel: guest.vehicle_model || '',
    foodAllergies: guest.food_allergies || '',
    specialNeeds: guest.special_needs || '',
    additionalNotes: guest.additional_notes || '',
    status: guest.status || '',
    profilePicture: guest.photo_path || '',
    submittedAt: guest.created_at || '',
    preApprovedBy: guest.pre_approved_by,
    preApprovedAt: guest.pre_approved_at,
    preApprovalDeniedBy: guest.pre_approval_denied_by,
    preApprovalDeniedAt: guest.pre_approval_denied_at,
    approvedBy: guest.approved_by,
    approvedAt: guest.approved_at,
    deniedBy: guest.denied_by,
    deniedAt: guest.denied_at
  };
}

/**
 * Formats multiple guest records
 * Pure function for testability
 * 
 * @param guests Array of raw guest data from database
 * @returns Array of formatted submission objects
 */
export async function formatGuestDataList(guests: any[]): Promise<Submission[]> {
  if (!Array.isArray(guests)) {
    return [];
  }

  const formattedGuests = await Promise.all(
    guests.map(guest => formatGuestData(guest))
  );

  return formattedGuests;
}
