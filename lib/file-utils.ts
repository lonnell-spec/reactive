'use server'

/**
 * Checks if a file size is within the allowed limit
 * Pure function for testability
 * 
 * @param file File or file-like object
 * @param maxSizeBytes Maximum size in bytes (default: 5MB)
 * @returns True if file size is valid
 */
export async function isValidFileSize(
  file: { size: number } | null | undefined,
  maxSizeBytes: number = 5 * 1024 * 1024
): Promise<boolean> {
  if (!file || typeof file.size !== 'number') {
    return false;
  }
  
  return file.size > 0 && file.size <= maxSizeBytes;
}

/**
 * Checks if a file type is an image
 * Pure function for testability
 * 
 * @param file File or file-like object
 * @returns True if file type is an image
 */
export async function isImageFile(
  file: { type: string } | null | undefined
): Promise<boolean> {
  if (!file || typeof file.type !== 'string') {
    return false;
  }
  
  return file.type.startsWith('image/');
}

/**
 * Validates if an object has file-like properties
 * Pure function for testability
 * 
 * @param val Object to validate
 * @returns True if object has file-like properties
 */
export async function hasFileProperties(val: unknown): Promise<boolean> {
  return (
    val !== null &&
    val !== undefined &&
    typeof val === 'object' &&
    'name' in val &&
    'size' in val &&
    'type' in val
  );
}

/**
 * Formats file size in human-readable format
 * Pure function for testability
 * 
 * @param bytes File size in bytes
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted file size string
 */
export async function formatFileSize(
  bytes: number,
  decimals: number = 2
): Promise<string> {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) throw new Error('File size cannot be negative');
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
