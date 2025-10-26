'use server'

import { createClient } from '@supabase/supabase-js';
import { guestFormSchema, fileSchema, GuestStatus } from './types';
import { revalidatePath } from 'next/cache';
import { sendTextMagicSMS } from './textmagic';

// Utility functions to get different Supabase clients
function getSupabaseAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase anon credentials');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Default client for backward compatibility with other functions
const supabase = getSupabaseServiceClient();

/**
 * Rollback a guest submission in case of error
 */
async function rollbackGuestSubmission(
  cleanup: {
    guestId: string | null;
    childrenIds: string[];
    uploadedFiles: string[];
  },
  supabaseService: ReturnType<typeof getSupabaseServiceClient>
) {
  try {
    console.log('Starting rollback process...');
    
    // Delete uploaded files first
    if (cleanup.uploadedFiles.length > 0) {
      console.log(`Deleting ${cleanup.uploadedFiles.length} uploaded files...`);
      
      for (const filePath of cleanup.uploadedFiles) {
        const { error } = await supabaseService
          .storage
          .from('guest-photos')
          .remove([filePath]);
          
        if (error) {
          console.error(`Failed to delete file ${filePath}:`, error);
        }
      }
    }
    
    // Delete children records
    if (cleanup.childrenIds.length > 0) {
      console.log(`Deleting ${cleanup.childrenIds.length} child records...`);
      
      const { error } = await supabaseService
        .from('guest_children')
        .delete()
        .in('id', cleanup.childrenIds);
        
      if (error) {
        console.error('Failed to delete child records:', error);
      }
    }
    
    // Delete guest record
    if (cleanup.guestId) {
      console.log(`Deleting guest record ${cleanup.guestId}...`);
      
      const { error } = await supabaseService
        .from('guests')
        .delete()
        .eq('id', cleanup.guestId);
        
      if (error) {
        console.error('Failed to delete guest record:', error);
      }
    }
    
    console.log('Rollback completed');
  } catch (error) {
    console.error('Error during rollback:', error);
  }
}

export async function submitGuestForm(formData: FormData) {
  // Use anon client for regular operations
  const supabaseAnon = getSupabaseAnonClient();
  // Use service client for rollback operations
  const supabaseService = getSupabaseServiceClient();
  
  // Keep track of resources to clean up in case of error
  const cleanup = {
    guestId: null as string | null,
    childrenIds: [] as string[],
    uploadedFiles: [] as string[],
  };
  
  try {
    // Extract form data
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const visitDate = formData.get('visitDate') as string;
    const gatheringTime = formData.get('gatheringTime') as string;
    const totalGuests = formData.get('totalGuests') as string;
    const hasChildrenForFormationKids = formData.get('hasChildrenForFormationKids') === 'true';
    const carType = formData.get('carType') as string;
    const vehicleColor = formData.get('vehicleColor') as string;
    const vehicleMake = formData.get('vehicleMake') as string;
    const vehicleModel = formData.get('vehicleModel') as string;
    const foodAllergies = formData.get('foodAllergies') as string;
    const specialNeeds = formData.get('specialNeeds') as string;
    const additionalNotes = formData.get('additionalNotes') as string;
    
    // Get profile picture
    const profilePicture = formData.get('profilePicture') as File;
    
    // Parse children info (sent as JSON string)
    const childrenInfoStr = formData.get('childrenInfo') as string;
    const childrenInfo = childrenInfoStr ? JSON.parse(childrenInfoStr) : [];
    
    // Extract child photos directly from formData
    // They'll be named like childPhoto_0, childPhoto_1, etc.
    const childPhotos: Record<string, File> = {}; 
    
    // Use Array.from to convert iterator to array for TypeScript compatibility
    Array.from(formData.entries()).forEach(([key, value]) => {
      if (key.startsWith('childPhoto_') && value instanceof File) {
        const index = key.split('_')[1];
        childPhotos[index] = value;
        console.log(`Found child photo for index ${index}:`, value.name);
      }
    });

    // Validate form data
    const guestData = {
      firstName,
      lastName,
      email,
      phone,
      visitDate,
      gatheringTime,
      totalGuests,
      hasChildrenForFormationKids,
      carType,
      vehicleColor,
      vehicleMake,
      vehicleModel,
      foodAllergies,
      specialNeeds,
      additionalNotes,
      profilePicture,
      childrenInfo,
    };

    // Validate form data - schema should work with File objects on server
    const parsedData = guestFormSchema.parse(guestData);

    // Validate profile picture
    if (!profilePicture || !(profilePicture instanceof File)) {
      throw new Error('Profile picture is required');
    }
    
    // File type and size validation
    if (profilePicture instanceof File) {
      if (!profilePicture.type.startsWith('image/')) {
        throw new Error('Profile picture must be an image');
      }
      
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (profilePicture.size > maxSizeInBytes) {
        throw new Error('Profile picture must be less than 5MB');
      }
    }

    // Validate child photos if any
    if (parsedData.hasChildrenForFormationKids && parsedData.childrenInfo.length > 0) {
      for (let i = 0; i < parsedData.childrenInfo.length; i++) {
        const child = parsedData.childrenInfo[i];
        const childPhoto = childPhotos[i.toString()];
        
        if (childPhoto) {
          if (!childPhoto.type.startsWith('image/')) {
            throw new Error(`Child photo for ${child.name} must be an image`);
          }
          
          const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
          if (childPhoto.size > maxSizeInBytes) {
            throw new Error(`Child photo for ${child.name} must be less than 5MB`);
          }
        }
      }
    }

    // Prepare data for Supabase
    const guestRecord = {
      status: GuestStatus.PENDING_PRE_APPROVAL,
      first_name: parsedData.firstName,
      last_name: parsedData.lastName,
      phone: parsedData.phone,
      email: parsedData.email,
      visit_date: parsedData.visitDate,
      gathering_time: parsedData.gatheringTime,
      total_guests: parseInt(parsedData.totalGuests, 10),
      should_enroll_children: parsedData.hasChildrenForFormationKids,
      vehicle_type: parsedData.carType,
      vehicle_make: parsedData.vehicleMake || null,
      vehicle_model: parsedData.vehicleModel || null, 
      vehicle_color: parsedData.vehicleColor || null,
      food_allergies: parsedData.foodAllergies || null,
      special_needs: parsedData.specialNeeds || null,
      additional_notes: parsedData.additionalNotes || null,
    };

    // Step 1: Insert guest record using anon key
    const { data: guest, error: guestError } = await supabaseAnon
      .from('guests')
      .insert(guestRecord)
      .select('id')
      .single();

    if (guestError) {
      console.error('Error inserting guest:', guestError);
      throw new Error('Failed to create guest record');
    }

    // Store guest ID for potential rollback
    cleanup.guestId = guest.id;

    // Step 2: Upload profile picture using anon key
    if (profilePicture instanceof File) {
      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await profilePicture.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Use a well-defined path: guest/{guest_id}/{filename}
      const filePath = `guest/${guest.id}/${profilePicture.name}`;
      const { error: uploadError } = await supabaseAnon
        .storage
        .from('guest-photos')
        .upload(filePath, buffer, {
          contentType: profilePicture.type,
        });

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        throw new Error('Failed to upload profile picture');
      }

      // Add to cleanup list
      cleanup.uploadedFiles.push(filePath);

      // Update guest record with photo path using anon key
      const { error: updateError } = await supabaseAnon
        .from('guests')
        .update({ photo_path: filePath })
        .eq('id', guest.id);
        
      if (updateError) {
        console.error('Error updating guest with photo path:', updateError);
        throw new Error('Failed to update guest with photo path');
      }
    }

    // Step 3: Insert children if any using anon key
    if (parsedData.hasChildrenForFormationKids && parsedData.childrenInfo.length > 0) {
      for (let i = 0; i < parsedData.childrenInfo.length; i++) {
        const child = parsedData.childrenInfo[i];
        const childPhoto = childPhotos[i.toString()];
        
        // Prepare child record
        const childRecord = {
          guest_id: guest.id,
          name: child.name,
          dob: child.dob || null,
          allergies: child.allergies || null,
        };

        // Insert child record one at a time
        const { data: childData, error: childError } = await supabaseAnon
          .from('guest_children')
          .insert(childRecord)
          .select('id')
          .single();

        if (childError) {
          console.error('Error inserting child:', childError);
          throw new Error(`Failed to insert child record for ${child.name}`);
        }

        // Store child ID for potential rollback
        cleanup.childrenIds.push(childData.id);

        // Step 4: Upload child photo if available using anon key
        if (childPhoto) {
          // Convert File to ArrayBuffer for upload
          const arrayBuffer = await childPhoto.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Use a well-defined path: guest/{guest_id}/child/{child_id}/{filename}
          const filePath = `guest/${guest.id}/child/${childData.id}/${childPhoto.name}`;
          console.log('Uploading child photo to:', filePath);
          const { error: uploadError } = await supabaseAnon
            .storage
            .from('guest-photos')
            .upload(filePath, buffer, {
              contentType: childPhoto.type,
            });

          if (uploadError) {
            console.error('Error uploading child photo:', uploadError);
            throw new Error(`Failed to upload photo for child ${child.name}`);
          }

          // Add to cleanup list
          cleanup.uploadedFiles.push(filePath);

          // Update child record with photo path using anon key
          const { error: updateError } = await supabaseAnon
            .from('guest_children')
            .update({ photo_path: filePath })
            .eq('id', childData.id);
            
          if (updateError) {
            console.error('Error updating child with photo path:', updateError);
            throw new Error(`Failed to update child ${child.name} with photo path`);
          }
        }
      }
    }

    // Step 5: Trigger pre-approval notification
    await sendPreApprovalNotification(guest.id);

    // Revalidate the path to update UI
    revalidatePath('/');

    return {
      success: true,
      submissionId: guest.id,
      message: 'Guest registration submitted successfully and pending pre-approval.'
    };

  } catch (error) {
    console.error('Form submission error:', error);
    
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

// Function to send pre-approval notification
async function sendPreApprovalNotification(guestId: string) {
  try {
    // Get the guest information from Supabase
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    // Get pre-approver phone number from environment variable
    const preApproverPhone = process.env.PRE_APPROVER_PHONE;
    
    if (!preApproverPhone) {
      console.warn('Pre-approver phone number not configured');
      return false;
    }
    
    // Format the message
    const message = `
New guest registration requires pre-approval:
Name: ${guest.first_name} ${guest.last_name}
Visit Date: ${new Date(guest.visit_date).toLocaleDateString()}
Time: ${guest.gathering_time}
Guests: ${guest.total_guests}
Approve at: ${process.env.APP_URL}/admin
`;
    
    // Send the SMS using TextMagic
    const { success, error } = await sendTextMagicSMS({
      phone: preApproverPhone,
      message: message,
    });
    
    if (!success) {
      console.warn(`Failed to send SMS: ${error}`);
      // Don't throw an error here, as we don't want to fail the whole submission
      // if the SMS notification fails
    } else {
      console.log(`Pre-approval notification sent for guest ID: ${guestId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send pre-approval notification:', error);
    return false;
  }
}

/**
 * Sends an SMS notification to a guest when their registration has been pre-approved
 * Uses the template from NEW_WORKFLOW_SUMMARY.md Step 3A
 */
export async function notifyGuestOfPreApproval(guestId: string) {
  try {
    // Get the guest details from Supabase
    const supabase = getSupabaseServiceClient();
    
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (fetchError || !guest) {
      throw new Error(fetchError?.message || 'Guest not found');
    }
    
    // Format the message according to the template in NEW_WORKFLOW_SUMMARY.md
    const message = `
✅ 2819 CHURCH Update

Hello ${guest.first_name}! Your guest registration has been pre-approved.

Your request is now being reviewed by our admin team. 
You'll receive another notification once final approval is complete.

Thank you for your patience!
`;
    
    // Send the SMS using TextMagic
    const { success, error } = await sendTextMagicSMS({
      phone: guest.phone,
      message: message,
    });
    
    if (!success) {
      console.warn(`Failed to send pre-approval SMS: ${error}`);
      // Don't throw an error here, as we don't want to fail the whole process
      // if the SMS notification fails
    } else {
      console.log(`Pre-approval notification sent to guest: ${guest.first_name} ${guest.last_name}`);
    }
    
    return { success, error };
  } catch (err) {
    console.error('Error notifying guest of pre-approval:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error notifying guest of pre-approval' 
    };
  }
}

/**
 * Sends an SMS notification to a guest when their registration has been approved
 * Includes a link to view their QR code
 */
export async function notifyGuestOfApproval(guestId: string) {
  try {
    // Get the guest details from Supabase
    const supabase = getSupabaseServiceClient();
    
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (fetchError || !guest) {
      throw new Error(fetchError?.message || 'Guest not found');
    }
    
    // Create the URL for the QR code using the credential_id
    const qrCodeUrl = `${process.env.APP_URL}/guestcredentials?credential=${guest.credential_id}`;
    
    // Format the approval message with QR code link
    const message = `
✅ 2819 CHURCH - Registration Approved!

Congratulations ${guest.first_name}! Your guest registration has been approved.

View your digital pass here: ${qrCodeUrl}

Your code word is: ${guest.code_word}

Please have this ready when you arrive on ${new Date(guest.visit_date).toLocaleDateString()}.

We look forward to seeing you!
`;
    
    // Send the SMS using TextMagic
    const { success, error } = await sendTextMagicSMS({
      phone: guest.phone,
      message: message,
    });
    
    if (!success) {
      console.warn(`Failed to send approval SMS: ${error}`);
    } else {
      console.log(`Approval notification sent to guest: ${guest.first_name} ${guest.last_name}`);
    }
    
    return { success, error };
  } catch (err) {
    console.error('Error notifying guest of approval:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error notifying guest of approval' 
    };
  }
}

/**
 * Sends an SMS notification to a guest when their registration has been denied at pre-approval stage
 * Uses the template from NEW_WORKFLOW_SUMMARY.md Step 3B
 */
export async function notifyGuestOfPreApprovalDenial(guestId: string) {
  try {
    // Get the guest details from Supabase
    const supabase = getSupabaseServiceClient();
    
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (fetchError || !guest) {
      throw new Error(fetchError?.message || 'Guest not found');
    }
    
    // Format the message according to the template in NEW_WORKFLOW_SUMMARY.md Step 3B
    const message = `
❌ 2819 CHURCH Update

Dear ${guest.first_name}, we're unable to approve your guest registration at this time.

If you have any questions, please contact our church office.

Blessings,
2819 CHURCH Team
`;
    
    // Send the SMS using TextMagic
    const { success, error } = await sendTextMagicSMS({
      phone: guest.phone,
      message: message,
    });
    
    if (!success) {
      console.warn(`Failed to send pre-approval denial SMS: ${error}`);
    } else {
      console.log(`Pre-approval denial notification sent to guest: ${guest.first_name} ${guest.last_name}`);
    }
    
    return { success, error };
  } catch (err) {
    console.error('Error notifying guest of pre-approval denial:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error notifying guest of pre-approval denial' 
    };
  }
}

/**
 * Sends an SMS notification to a guest when their registration has been denied
 * Uses the same template as pre-approval denial from NEW_WORKFLOW_SUMMARY.md Step 3B
 */
export async function notifyGuestOfDenial(guestId: string) {
  try {
    // Get the guest details from Supabase
    const supabase = getSupabaseServiceClient();
    
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (fetchError || !guest) {
      throw new Error(fetchError?.message || 'Guest not found');
    }
    
    // Format the message - using the same template as pre-approval denial
    const message = `
❌ 2819 CHURCH Update

Dear ${guest.first_name}, we're unable to approve your guest registration at this time.

If you have any questions, please contact our church office.

Blessings,
2819 CHURCH Team
`;
    
    // Send the SMS using TextMagic
    const { success, error } = await sendTextMagicSMS({
      phone: guest.phone,
      message: message,
    });
    
    if (!success) {
      console.warn(`Failed to send denial SMS: ${error}`);
    } else {
      console.log(`Denial notification sent to guest: ${guest.first_name} ${guest.last_name}`);
    }
    
    return { success, error };
  } catch (err) {
    console.error('Error notifying guest of denial:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error notifying guest of denial' 
    };
  }
}

/**
 * Retrieves guest credentials (QR code, code word, etc.) for display
 * Uses the service role to ensure access regardless of authentication status
 * Uses the credential_id field for secure access
 */
export async function getGuestCredentials(credentialId: string) {
  try {
    const supabase = getSupabaseServiceClient();
    
    // Find the guest by credential_id
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        visit_date,
        gathering_time,
        total_guests,
        qr_code,
        code_word,
        qr_expiry,
        status
      `)
      .eq('credential_id', credentialId)
      .single();
    
    if (fetchError) {
      throw new Error('Failed to retrieve guest information');
    }
    
    if (!guest) {
      return {
        success: false,
        message: 'Guest credentials not found or invalid'
      };
    }
    
    // Check if QR code has expired
    const now = new Date();
    const expiryDate = new Date(guest.qr_expiry);
    
    if (now > expiryDate) {
      return {
        success: false,
        message: 'Your guest pass has expired'
      };
    }
    
    // Check if guest is approved
    if (guest.status !== GuestStatus.APPROVED) {
      return {
        success: false,
        message: 'This guest registration is not approved'
      };
    }
    
    return {
      success: true,
      guest: {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        visitDate: guest.visit_date,
        gatheringTime: guest.gathering_time,
        totalGuests: guest.total_guests,
        qrCode: guest.qr_code,
        codeWord: guest.code_word,
        qrExpiry: guest.qr_expiry
      }
    };
  } catch (error) {
    console.error('Error retrieving guest credentials:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve guest credentials'
    };
  }
}

// Function to check guest status
export async function checkGuestStatus(submissionId: string, phone: string) {
  try {
    const { data: guest, error } = await supabase
      .from('guests')
      .select('*')
      .eq('id', submissionId)
      .eq('phone', phone)
      .single();

    if (error) {
      throw error;
    }

    if (!guest) {
      return {
        success: false,
        message: 'No guest found with the provided information.'
      };
    }

    return {
      success: true,
      status: guest.status,
      guest
    };
  } catch (error) {
    console.error('Error checking guest status:', error);
    return {
      success: false,
      message: 'Failed to check guest status.'
    };
  }
}