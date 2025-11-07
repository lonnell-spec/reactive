'use server'

import { guestFormSchema, fileSchema, GuestStatus, GuestFormData, GuestInsertResult, ChildInfo, ChildInfoNoPhoto, Cleanup } from './types';
import { revalidatePath } from 'next/cache';
import { getSupabaseServiceClient } from './supabase-client';
import { rollbackGuestSubmission } from './rollback';
import { sendPreApproverNotification } from './notifications';
import { parseFormBoolean, parseChildrenWithPhotos, getFormString } from './form-utils';
import { fileToBuffer, generateProfilePicturePath, uploadChildPhoto, prepareProfilePictureUpload } from './storage-utils';
import { mapFormDataToGuestRecord, mapChildInfoToRecord, createGuestProfileUpdateRecord, createChildPhotoUpdateRecord } from './database-utils';
import { calculateExpireDateTime } from './date-utils';


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
    throw new Error('Failed to upload profile picture');
  }
  return filePath;
}

/**
 * Parses and validates the form data. Importantly photos stay out of serialisation and deserialisation.
 */
async function parseAndValidate(formData: FormData): Promise<GuestFormData> {
  const rawFormData = Object.fromEntries(formData);

  // Extract actual guest photo from formData
  const profilePicture = formData.get('profilePicture') as File;

  // Parse the form data for has children using pure function
  const hasChildrenForFormationKids = await parseFormBoolean(rawFormData.hasChildrenForFormationKids);

  // Parse children information using pure function
  const childrenWithPhoto = hasChildrenForFormationKids 
    ? await parseChildrenWithPhotos(rawFormData.childrenInfo, formData)
    : [];

  // Create the parsed data object using pure helper functions
  const parsedData = {
    firstName: await getFormString(rawFormData.firstName),
    lastName: await getFormString(rawFormData.lastName),
    email: await getFormString(rawFormData.email),
    phone: await getFormString(rawFormData.phone),
    visitDate: await getFormString(rawFormData.visitDate),
    gatheringTime: await getFormString(rawFormData.gatheringTime),
    totalGuests: await getFormString(rawFormData.totalGuests),
    hasChildrenForFormationKids,
    childrenInfo: childrenWithPhoto,
    carType: await getFormString(rawFormData.carType),
    vehicleColor: await getFormString(rawFormData.vehicleColor),
    vehicleMake: await getFormString(rawFormData.vehicleMake),
    vehicleModel: await getFormString(rawFormData.vehicleModel),
    foodAllergies: await getFormString(rawFormData.foodAllergies),
    specialNeeds: await getFormString(rawFormData.specialNeeds),
    additionalNotes: await getFormString(rawFormData.additionalNotes),
    profilePicture: profilePicture,
  };

  // Validate the parsed data
  const validatedData = guestFormSchema.parse(parsedData);
  return validatedData;
}

async function insertGuest(supabaseService: Awaited<ReturnType<typeof getSupabaseServiceClient>>, parsedData: GuestFormData): Promise<GuestInsertResult> {
  // Calculate expires_at based on visit_date (Monday after visit_date at midnight)
  const visitDate = new Date(parsedData.visitDate);
  const expiresAt = await calculateExpireDateTime(visitDate);
  
  // Map form data to database record using pure utility
  const guestRecord = await mapFormDataToGuestRecord(parsedData, expiresAt);
  
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
