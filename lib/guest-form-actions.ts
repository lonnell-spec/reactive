'use server'

import { guestFormSchema, fileSchema, GuestStatus, GuestFormData, GuestInsertResult, ChildInfo, ChildInfoNoPhoto, Cleanup } from './types';
import { revalidatePath } from 'next/cache';
import { getSupabaseServiceClient } from './supabase-client';
import { rollbackGuestSubmission } from './rollback';
import { sendPreApproverNotification } from './notifications';
import { parseFormBoolean, parseChildrenWithPhotos, getFormString } from './form-utils';
import { fileToBuffer, generateProfilePicturePath, uploadChildPhoto, prepareProfilePictureUpload } from './storage-utils';
import { mapFormDataToGuestRecord, mapChildInfoToRecord, createGuestProfileUpdateRecord, createChildPhotoUpdateRecord } from './database-utils';
import { calculateExpiryFromVisitDate } from './date-timezone-utils';
import { generateUniqueRandom9DigitInteger } from './random-utils';


/**
 * Main function to handle guest form submission
 * 
 * @param formData Form data to process
 * @param dependencies Injectable dependencies for testing
 */
export async function submitGuestForm(
  formData: FormData,
  dependencies: {
    getSupabaseClient?: () => Promise<Awaited<ReturnType<typeof getSupabaseServiceClient>>>;
    uploadProfilePictureFn?: typeof uploadProfilePicture;
    insertChildrenFn?: typeof insertChildrenWithPhotos;
    sendNotificationFn?: typeof sendPreApproverNotification;
  } = {}
) {
  // Initialize Supabase client using injectable dependency
  const {
    getSupabaseClient = getSupabaseServiceClient,
    uploadProfilePictureFn = uploadProfilePicture,
    insertChildrenFn = insertChildrenWithPhotos,
    sendNotificationFn = sendPreApproverNotification
  } = dependencies;
  
  const supabaseService = await getSupabaseClient();

  // Initialize cleanup object for rollback in case of error
  const cleanup: {
    guestId: string | null;
    childrenIds: string[];
    uploadedFiles: string[];
  } = { guestId: '', childrenIds: [], uploadedFiles: [] };

  try {
    // Validate FormData is not empty
    const entries = Array.from(formData.entries())
    if (entries.length === 0) {
      return {
        success: false,
        message: 'Server received empty form data. This may be a Next.js Server Action issue with large files.'
      }
    }

    const parsedData = await parseAndValidate(formData);

    const guest = await insertGuest(supabaseService, parsedData);

    // Store guest ID for potential rollback
    cleanup.guestId = guest.id;

    const profilePath = await uploadProfilePictureFn(supabaseService, parsedData, guest);

    // Add profile picture path to cleanup list
    cleanup.uploadedFiles.push(profilePath as never);

    await updateGuestWithProfilePicturePath(supabaseService, profilePath, guest);

    await insertChildrenFn(supabaseService, parsedData, guest, cleanup);

    // Note: QR code, code_word, and pass_id will be generated only when guest is approved

    await sendNotificationFn(guest.id);

    // Revalidate the path to update UI
    revalidatePath('/');

    return {
      success: true,
      submissionId: guest.external_guest_id,
      message: 'Guest registration submitted successfully and pending pre-approval.'
    };

  } catch (error) {
    console.error('Error submitting guest form:', error);
    
    // Attempt to roll back using service role key
    await rollbackGuestSubmission(cleanup, supabaseService);

    if (error instanceof Error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: false,
      message: 'An unknown error occurred during form submission.'
    };
  }
}

async function insertChildrenWithPhotos(
  supabaseService: Awaited<ReturnType<typeof getSupabaseServiceClient>>, 
  parsedData: GuestFormData, 
  guest: GuestInsertResult, 
  cleanup: Cleanup,
  dependencies: {
    uploadPhotoFn?: typeof uploadChildPhoto;
    insertChildFn?: (service: any, record: any) => Promise<{ data: any; error: any }>;
    updateChildFn?: (service: any, record: any, id: string) => Promise<{ error: any }>;
  } = {}
) {
  // Extract dependencies with defaults
  const {
    uploadPhotoFn = uploadChildPhoto,
    insertChildFn = (service, record) => service.from('guest_children').insert(record).select().single(),
    updateChildFn = (service, record, id) => service.from('guest_children').update(record).eq('id', id)
  } = dependencies;

  if (parsedData.hasChildrenForFormationKids && parsedData.childrenInfo.length > 0) {
    for (const child of parsedData.childrenInfo) {
      // Map child data to database record using pure utility
      const childRecord = await mapChildInfoToRecord(child, guest.id);
      
      // Insert child record using injectable function
      const { data: childData, error: childError } = await insertChildFn(supabaseService, childRecord);

      if (childError) {
        console.error(`[insertChildrenWithPhotos] Failed to insert child record for guest ${guest.id}:`, childError);
        throw new Error(`Failed to insert child record for ${child.name}`);
      }

      // Store child ID for potential rollback
      cleanup.childrenIds.push(childData.id as never);

      // Upload child photo if available using injected function
      if (child.photo) {
        const filePath = await uploadPhotoFn(
          supabaseService,
          child.photo,
          guest.id,
          childData.id as string
        );

        // Add to cleanup list
        cleanup.uploadedFiles.push(filePath as never);

        // Update child record with photo path using injectable function
        const updateRecord = await createChildPhotoUpdateRecord(filePath);
        const { error: updateError } = await updateChildFn(supabaseService, updateRecord, childData.id as string);

        if (updateError) {
          console.error(`[insertChildrenWithPhotos] Failed to update child photo path for guest ${guest.id}:`, updateError);
          throw new Error(`Failed to update child ${child.name} with photo path`);
        }
      }
    }
  }
}


async function updateGuestWithProfilePicturePath(supabaseService: Awaited<ReturnType<typeof getSupabaseServiceClient>>, profilePath: string, guest: GuestInsertResult) {
  // Create update record using pure utility
  const updateRecord = await createGuestProfileUpdateRecord(profilePath);
  
  const { error: profileUpdateError } = await supabaseService
    .from('guests')
    .update(updateRecord)
    .eq('id', guest.id as string);

  if (profileUpdateError) {
    console.error(`[updateGuestWithProfilePicturePath] Failed to update guest ${guest.id} with profile picture path:`, profileUpdateError);
    throw new Error('Failed to update guest with profile picture path');
  }
}

async function uploadProfilePicture(supabaseService: Awaited<ReturnType<typeof getSupabaseServiceClient>>, parsedData: GuestFormData, guest: GuestInsertResult) {
  // Prepare upload data using pure utility
  const { buffer, filePath, contentType } = await prepareProfilePictureUpload(
    parsedData.profilePicture!,
    guest.id
  );
  
  const { error: profileUploadError } = await supabaseService
    .storage
    .from('guest-photos')
    .upload(filePath, buffer, {
      contentType,
    });

  if (profileUploadError) {
    console.error(`[uploadProfilePicture] Failed to upload profile picture for guest ${guest.id}:`, profileUploadError);
    throw new Error('Failed to upload profile picture');
  }
  return filePath;
}

/**
 * Parse children with photos from JSON structure (new format)
 */
async function parseChildrenWithPhotosFromJson(
  childrenInfoJson: any[],
  formData: FormData
): Promise<any[]> {
  const childrenWithPhoto = [];
  
  for (let i = 0; i < childrenInfoJson.length; i++) {
    const child = childrenInfoJson[i];
    const photo = formData.get(`childPhoto_${i}`) as File | null;
    
    childrenWithPhoto.push({
      name: child.name || '',
      dob: child.dob || '',
      allergies: child.allergies || '',
      photo: photo
    });
  }
  
  return childrenWithPhoto;
}

/**
 * Parses and validates the form data. Importantly photos stay out of serialisation and deserialisation.
 */
async function parseAndValidate(formData: FormData): Promise<GuestFormData> {
  // Extract the JSON form data
  const formDataJson = formData.get('formData') as string;
  
  if (!formDataJson) {
    throw new Error('No form data found in FormData')
  }
  
  let textData: any;
  try {
    textData = JSON.parse(formDataJson);
  } catch (error) {
    console.error('Failed to parse JSON form data:', error)
    throw new Error('Invalid form data format')
  }

  // Extract actual guest photo from formData
  const profilePicture = formData.get('profilePicture') as File;

  // Parse children information with photos
  const childrenWithPhoto = textData.hasChildrenForFormationKids && textData.childrenInfo?.length > 0
    ? await parseChildrenWithPhotosFromJson(textData.childrenInfo, formData)
    : [];

  // Create the parsed data object directly from JSON
  const parsedData = {
    firstName: textData.firstName || '',
    lastName: textData.lastName || '',
    email: textData.email || '',
    phone: textData.phone || '',
    visitDate: textData.visitDate || '',
    gatheringTime: textData.gatheringTime || '',
    totalGuests: textData.totalGuests || '',
    hasChildrenForFormationKids: textData.hasChildrenForFormationKids || false,
    childrenInfo: childrenWithPhoto,
    carType: textData.carType || '',
    vehicleColor: textData.vehicleColor || '',
    vehicleMake: textData.vehicleMake || '',
    vehicleModel: textData.vehicleModel || '',
    foodAllergies: textData.foodAllergies || '',
    specialNeeds: textData.specialNeeds || '',
    additionalNotes: textData.additionalNotes || '',
    profilePicture: profilePicture,
  };

  // Validate the parsed data
  try {
    const validatedData = guestFormSchema.parse(parsedData);
    return validatedData;
  } catch (error) {
    console.error('Zod validation failed:', error)
    throw error
  }
}

async function insertGuest(supabaseService: Awaited<ReturnType<typeof getSupabaseServiceClient>>, parsedData: GuestFormData): Promise<GuestInsertResult> {
  // Calculate expires_at based on visit_date (Monday after visit_date at end of day)
  // parsedData.visitDate is still YYYY-MM-DD format from form, so we can use it directly
  const expiresAt = calculateExpiryFromVisitDate(parsedData.visitDate);
  
  // Generate unique 9-digit random integer for text callback reference
  const textCallbackReferenceId = await generateUniqueRandom9DigitInteger(
    async (value: number) => {
      // Check if this reference ID already exists
      const { data, error } = await supabaseService
        .from('guests')
        .select('id')
        .eq('text_callback_reference_id', value)
        .single();
      
      // Return true if unique (no existing record found)
      return error !== null || data === null;
    }
  );
  
  // Map form data to database record using pure utility
  const guestRecord = await mapFormDataToGuestRecord(parsedData, expiresAt, textCallbackReferenceId);
  
  const { data: guest, error: guestError } = await supabaseService
    .from('guests')
    .insert(guestRecord)
    .select('id, external_guest_id')
    .single();

  if (guestError) {
    console.error('Failed to submit guest information:', guestError);
    throw new Error('Failed to submit guest information');
  }

  return guest;
}
