'use server'

import { ChildInfo, ChildInfoNoPhoto } from './types';

/**
 * Parses a boolean value from form data
 * Pure function for testability
 * 
 * @param value The form data value to parse
 * @returns Boolean value
 */
export async function parseFormBoolean(value: unknown): Promise<boolean> {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
}

/**
 * Safely parses JSON string with fallback
 * Pure function for testability
 * 
 * @param jsonString The JSON string to parse
 * @param fallback Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export async function safeJsonParse<T>(
  jsonString: unknown, 
  fallback: T
): Promise<T> {
  if (typeof jsonString !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    return fallback;
  }
}

/**
 * Extracts children information from form data with photos
 * Pure function for testability
 * 
 * @param childrenInfoRaw Raw children info from form
 * @param formData FormData object containing child photos
 * @returns Array of children with photos attached
 */
export async function parseChildrenWithPhotos(
  childrenInfoRaw: unknown,
  formData: FormData
): Promise<ChildInfo[]> {
  const childrenInfoNoPhoto = await safeJsonParse<ChildInfoNoPhoto[]>(
    childrenInfoRaw, 
    []
  );

  const childrenWithPhoto: ChildInfo[] = [];
  
  for (let i = 0; i < childrenInfoNoPhoto.length; i++) {
    const childNoPhoto = childrenInfoNoPhoto[i];
    const photo = formData.get(`childPhoto_${i}`) as File;
    
    childrenWithPhoto.push({
      name: childNoPhoto.name,
      dob: childNoPhoto.dob,
      allergies: childNoPhoto.allergies,
      photo: photo
    });
  }

  return childrenWithPhoto;
}

/**
 * Safely gets a string value from form data with fallback
 * Pure function for testability
 * 
 * @param value The form data value
 * @param fallback Fallback string (default: empty string)
 * @returns String value or fallback
 */
export async function getFormString(
  value: unknown, 
  fallback: string = ''
): Promise<string> {
  if (typeof value === 'string') {
    return value;
  }
  return fallback;
}
