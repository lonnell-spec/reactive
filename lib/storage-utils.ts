'use server'

/**
 * Converts a File to Buffer
 * Pure function for testability
 * 
 * @param file File to convert
 * @returns Buffer representation of the file
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  if (!file) {
    throw new Error('File is required');
  }
  
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates a storage path for guest profile pictures
 * Pure function for testability
 * 
 * @param guestId Guest ID
 * @param filename Original filename
 * @returns Storage path string
 */
export async function generateProfilePicturePath(
  guestId: string,
  filename: string
): Promise<string> {
  if (!guestId || !filename) {
    throw new Error('Guest ID and filename are required');
  }
  
  // Sanitize filename to prevent path traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `guest/${guestId}/profile/${sanitizedFilename}`;
}

/**
 * Generates a storage path for child photos
 * Pure function for testability
 * 
 * @param guestId Guest ID
 * @param childIndex Child index
 * @param filename Original filename
 * @returns Storage path string
 */
export async function generateChildPhotoPath(
  guestId: string,
  childIndex: number,
  filename: string
): Promise<string> {
  if (!guestId || childIndex < 0 || !filename) {
    throw new Error('Guest ID, valid child index, and filename are required');
  }
  
  // Sanitize filename to prevent path traversal
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `guest/${guestId}/children/${childIndex}/${sanitizedFilename}`;
}

/**
 * Generates a storage path for child photos using child ID
 * Pure function for testability
 * 
 * @param guestId Guest ID
 * @param childId Child ID  
 * @param filename Original filename
 * @returns Storage path string
 */
export async function generateChildPhotoPathById(
  guestId: string,
  childId: string,
  filename: string
): Promise<string> {
  if (!guestId || !childId || !filename) {
    throw new Error('Guest ID, child ID, and filename are required');
  }
  
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `guest/${guestId}/child/${childId}/${sanitizedFilename}`;
}

/**
 * Prepares profile picture upload data
 * Pure function for testability
 * 
 * @param profilePicture File to upload
 * @param guestId Guest ID
 * @returns Upload preparation data
 */
export async function prepareProfilePictureUpload(
  profilePicture: File,
  guestId: string
): Promise<{ buffer: Buffer; filePath: string; contentType: string }> {
  const buffer = await fileToBuffer(profilePicture);
  const filePath = await generateProfilePicturePath(guestId, profilePicture.name);
  
  return {
    buffer,
    filePath,
    contentType: profilePicture.type
  };
}

/**
 * Uploads child photo to storage
 * Orchestrator function that uses pure utilities
 * 
 * @param supabaseService Supabase service client
 * @param photo File to upload
 * @param guestId Guest ID
 * @param childId Child ID
 * @returns Storage path of uploaded file
 */
export async function uploadChildPhoto(
  supabaseService: any,
  photo: File,
  guestId: string,
  childId: string
): Promise<string> {
  // Convert File to Buffer using pure utility
  const buffer = await fileToBuffer(photo);
  
  // Generate storage path using pure utility
  const filePath = await generateChildPhotoPathById(guestId, childId, photo.name);
  
  // Upload to storage
  const { error: uploadError } = await supabaseService
    .storage
    .from('guest-photos')
    .upload(filePath, buffer, {
      contentType: photo.type,
    });

  if (uploadError) {
    throw new Error(`Failed to upload photo: ${uploadError.message}`);
  }

  return filePath;
}
