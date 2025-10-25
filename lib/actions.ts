'use server'

import { createClient } from '@supabase/supabase-js';
import { guestFormSchema, fileSchema, GuestStatus } from './types';
import { revalidatePath } from 'next/cache';

// Initialize Supabase client with server-side credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check that we have the required environment variables
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function submitGuestForm(formData: FormData) {
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

    // Insert guest record
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert(guestRecord)
      .select('id')
      .single();

    if (guestError) {
      console.error('Error inserting guest:', guestError);
      throw new Error('Failed to create guest record');
    }

    // Upload profile picture
    if (profilePicture instanceof File) {
      // Convert File to ArrayBuffer for upload
      const arrayBuffer = await profilePicture.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const filePath = `${guest.id}/${profilePicture.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from('guest-photos')
        .upload(filePath, buffer, {
          contentType: profilePicture.type,
        });

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        throw new Error('Failed to upload profile picture');
      }

      // Update guest record with photo path
      await supabase
        .from('guests')
        .update({ photo_path: filePath })
        .eq('id', guest.id);
    }

    // Insert children if any
    if (parsedData.hasChildrenForFormationKids && parsedData.childrenInfo.length > 0) {
      for (const child of parsedData.childrenInfo) {
        // Prepare child record
        const childRecord = {
          guest_id: guest.id,
          name: child.name,
          dob: child.dob || null,
          allergies: child.allergies || null,
        };

        // Insert child record
        const { error: childError } = await supabase
          .from('guest_children')
          .insert(childRecord);

        if (childError) {
          console.error('Error inserting child:', childError);
          // Continue with other children even if one fails
        }

        // Handle child photo if available
        // For this implementation, we'll assume child photos are handled separately
      }
    }

    // Trigger pre-approval notification
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
    // This would typically call your Supabase Edge Function to send the SMS
    // For now, we'll just log it
    console.log(`Pre-approval notification would be sent for guest ID: ${guestId}`);
    
    // In a production environment, you would call your Edge Function:
    // const { data, error } = await supabase.functions.invoke('send-pre-approval-sms', {
    //   body: { guestId },
    // });
    
    // if (error) throw error;
    // return data;
    
    return true;
  } catch (error) {
    console.error('Failed to send pre-approval notification:', error);
    return false;
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
