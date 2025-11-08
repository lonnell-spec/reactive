'use client'

import imageCompression from 'browser-image-compression'

/**
 * Configuration for image compression
 */
export interface ImageCompressionConfig {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  quality?: number
  fileType?: string
}

/**
 * Default compression settings optimized for profile photos (more aggressive for Server Actions)
 */
export const DEFAULT_PROFILE_COMPRESSION: ImageCompressionConfig = {
  maxSizeMB: 0.3, // Much more aggressive - 300KB max
  maxWidthOrHeight: 800, // Smaller dimensions
  useWebWorker: true, // Use web worker for better performance
  quality: 0.7, // Lower quality for smaller size
  fileType: 'image/jpeg' // Convert to JPEG for better compression
}

/**
 * Default compression settings for children photos (even more aggressive)
 */
export const DEFAULT_CHILD_COMPRESSION: ImageCompressionConfig = {
  maxSizeMB: 0.2, // Very aggressive - 200KB max
  maxWidthOrHeight: 600, // Smaller dimensions
  useWebWorker: true,
  quality: 0.6, // Lower quality for smaller size
  fileType: 'image/jpeg'
}

/**
 * Fallback compression using Canvas API (more reliable for FormData)
 */
async function compressImageWithCanvas(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          resolve(compressedFile)
        } else {
          reject(new Error('Canvas compression failed'))
        }
      }, 'image/jpeg', quality)
    }
    
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Compresses an image file using browser-image-compression with Canvas fallback
 * 
 * @param file The original image file
 * @param config Compression configuration (optional)
 * @returns Promise<File> The compressed image file
 */
export async function compressImage(
  file: File, 
  config: ImageCompressionConfig = DEFAULT_PROFILE_COMPRESSION
): Promise<File> {
  try {
    // Validate input
    if (!file) {
      throw new Error('No file provided for compression')
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }


    // Compress the image
    const compressedFile = await imageCompression(file, {
      maxSizeMB: config.maxSizeMB || 0.8,
      maxWidthOrHeight: config.maxWidthOrHeight || 1080,
      useWebWorker: config.useWebWorker !== false,
      fileType: config.fileType || 'image/jpeg',
      initialQuality: config.quality || 0.8
    })

    // Always ensure the compressed file has the original filename
    // This is critical for FormData to work correctly
    
    // Convert to ArrayBuffer first to ensure clean File object creation
    const arrayBuffer = await compressedFile.arrayBuffer()
    const finalFile = new File([arrayBuffer], file.name, {
      type: compressedFile.type || 'image/jpeg',
      lastModified: compressedFile.lastModified || Date.now()
    })
    
    // Validate that the File object is valid for FormData
    const testFormData = new FormData()
    testFormData.append('test', finalFile)
    const testEntries = Array.from(testFormData.entries())
    
    if (testEntries.length === 0) {
      throw new Error('Compressed file cannot be serialized to FormData')
    }

    return finalFile
  } catch (error) {
    console.error('Browser-image-compression failed, trying Canvas fallback:', error)
    
    try {
      // Fallback to Canvas compression
      const canvasCompressed = await compressImageWithCanvas(
        file,
        config.maxWidthOrHeight || 1200,
        config.quality || 0.9
      )
      
      return canvasCompressed
    } catch (fallbackError) {
      console.error('Canvas compression also failed:', fallbackError)
      throw new Error(`All compression methods failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

/**
 * Compresses a profile photo with optimized settings
 * 
 * @param file The original profile photo file
 * @returns Promise<File> The compressed profile photo
 */
export async function compressProfilePhoto(file: File): Promise<File> {
  return compressImage(file, DEFAULT_PROFILE_COMPRESSION)
}

/**
 * Compresses a profile photo with high quality settings for admin display
 * 
 * @param file The original profile photo file
 * @returns Promise<File> The compressed profile photo with higher quality
 */
export async function compressProfilePhotoHighQuality(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 1.2, // Allow slightly larger for better quality
    maxWidthOrHeight: 1400, // Higher resolution for crisp display
    useWebWorker: true,
    quality: 0.95, // Very high quality (95%)
    fileType: 'image/jpeg'
  })
}

/**
 * Compresses a child photo with optimized settings
 * 
 * @param file The original child photo file
 * @returns Promise<File> The compressed child photo
 */
export async function compressChildPhoto(file: File): Promise<File> {
  return compressImage(file, DEFAULT_CHILD_COMPRESSION)
}

/**
 * Validates file size before compression (to give user feedback)
 * 
 * @param file The file to validate
 * @param maxSizeMB Maximum allowed size in MB before compression
 * @returns boolean True if file is acceptable for compression
 */
export function validateFileForCompression(file: File, maxSizeMB: number = 10): boolean {
  if (!file) return false
  
  const fileSizeMB = file.size / 1024 / 1024
  
  if (fileSizeMB > maxSizeMB) {
    throw new Error(`File is too large (${fileSizeMB.toFixed(1)}MB). Please select a file smaller than ${maxSizeMB}MB.`)
  }
  
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file (JPG, PNG, etc.)')
  }
  
  return true
}

/**
 * Gets human-readable file size
 * 
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
