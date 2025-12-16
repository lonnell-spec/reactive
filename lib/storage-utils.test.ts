/**
 * Unit tests for storage utility functions
 * Tests path generation and sanitization (security-critical)
 */

import {
  generateProfilePicturePath,
  generateChildPhotoPath,
  generateChildPhotoPathById,
  prepareProfilePictureUpload
} from './storage-utils';

describe('Storage Utils', () => {
  describe('generateProfilePicturePath', () => {
    it('should generate correct path format', async () => {
      const result = await generateProfilePicturePath('guest-123', 'photo.jpg');
      
      expect(result).toBe('guest/guest-123/profile/photo.jpg');
    });

    it('should sanitize filename to prevent path traversal', async () => {
      const result = await generateProfilePicturePath('guest-123', '../../evil.jpg');
      
      // Sanitizes by replacing non-alphanumeric (except .- ) with _
      expect(result).toBe('guest/guest-123/profile/.._.._evil.jpg');
      // Slashes in the original filename are replaced with underscores
      const sanitizedFilename = result.split('/').pop();
      expect(sanitizedFilename).not.toContain('/');
    });

    it('should sanitize special characters', async () => {
      const testCases = [
        { input: '../../../etc/passwd', shouldNotContain: ['/', '\\'] },
        { input: 'file name with spaces.jpg', shouldNotContain: [' '] },
        { input: 'file@#$%name.jpg', shouldNotContain: ['@', '#', '$', '%'] },
        { input: 'file\\path\\name.jpg', shouldNotContain: ['\\'] }
      ];

      for (const { input, shouldNotContain } of testCases) {
        const result = await generateProfilePicturePath('guest-123', input);
        expect(result).toContain('guest/guest-123/profile/');
        for (const char of shouldNotContain) {
          expect(result.split('profile/')[1]).not.toContain(char);
        }
      }
    });

    it('should throw error for missing guest ID', async () => {
      await expect(
        generateProfilePicturePath('', 'photo.jpg')
      ).rejects.toThrow('Guest ID and filename are required');
    });

    it('should throw error for missing filename', async () => {
      await expect(
        generateProfilePicturePath('guest-123', '')
      ).rejects.toThrow('Guest ID and filename are required');
    });

    it('should preserve valid alphanumeric characters and dots', async () => {
      const result = await generateProfilePicturePath('guest-123', 'photo-2024.01.15.jpg');
      
      expect(result).toBe('guest/guest-123/profile/photo-2024.01.15.jpg');
    });
  });

  describe('generateChildPhotoPath', () => {
    it('should generate correct path format', async () => {
      const result = await generateChildPhotoPath('guest-123', 0, 'child.jpg');
      
      expect(result).toBe('guest/guest-123/children/0/child.jpg');
    });

    it('should sanitize filename to prevent path traversal', async () => {
      const result = await generateChildPhotoPath('guest-123', 0, '../../../evil.jpg');
      
      // Sanitizes by replacing non-alphanumeric (except .- ) with _
      expect(result).toBe('guest/guest-123/children/0/.._.._.._evil.jpg');
      // Slashes are replaced with underscores
      expect(result).not.toContain('/evil');
    });

    it('should handle multiple children indices', async () => {
      const result0 = await generateChildPhotoPath('guest-123', 0, 'child.jpg');
      const result1 = await generateChildPhotoPath('guest-123', 1, 'child.jpg');
      const result2 = await generateChildPhotoPath('guest-123', 2, 'child.jpg');
      
      expect(result0).toContain('/children/0/');
      expect(result1).toContain('/children/1/');
      expect(result2).toContain('/children/2/');
    });

    it('should throw error for negative child index', async () => {
      await expect(
        generateChildPhotoPath('guest-123', -1, 'child.jpg')
      ).rejects.toThrow('Guest ID, valid child index, and filename are required');
    });

    it('should throw error for missing parameters', async () => {
      await expect(
        generateChildPhotoPath('', 0, 'child.jpg')
      ).rejects.toThrow('Guest ID, valid child index, and filename are required');

      await expect(
        generateChildPhotoPath('guest-123', 0, '')
      ).rejects.toThrow('Guest ID, valid child index, and filename are required');
    });
  });

  describe('generateChildPhotoPathById', () => {
    it('should generate correct path format', async () => {
      const result = await generateChildPhotoPathById('guest-123', 'child-456', 'photo.jpg');
      
      expect(result).toBe('guest/guest-123/child/child-456/photo.jpg');
    });

    it('should sanitize filename to prevent path traversal', async () => {
      const result = await generateChildPhotoPathById('guest-123', 'child-456', '../hack.jpg');
      
      // Sanitizes by replacing non-alphanumeric (except .- ) with _
      expect(result).toBe('guest/guest-123/child/child-456/.._hack.jpg');
      // Slashes are replaced with underscores
      expect(result).not.toContain('/hack');
    });

    it('should throw error for missing parameters', async () => {
      await expect(
        generateChildPhotoPathById('', 'child-456', 'photo.jpg')
      ).rejects.toThrow('Guest ID, child ID, and filename are required');

      await expect(
        generateChildPhotoPathById('guest-123', '', 'photo.jpg')
      ).rejects.toThrow('Guest ID, child ID, and filename are required');

      await expect(
        generateChildPhotoPathById('guest-123', 'child-456', '')
      ).rejects.toThrow('Guest ID, child ID, and filename are required');
    });

    it('should handle UUID-style child IDs', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const result = await generateChildPhotoPathById('guest-123', uuid, 'photo.jpg');
      
      expect(result).toBe(`guest/guest-123/child/${uuid}/photo.jpg`);
    });
  });

  describe('prepareProfilePictureUpload', () => {
    it('should prepare upload with buffer and path', async () => {
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await prepareProfilePictureUpload(mockFile, 'guest-123');
      
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.filePath).toBe('guest/guest-123/profile/test.jpg');
      expect(result.contentType).toBe('image/jpeg');
    });

    it('should sanitize filename in prepared path', async () => {
      const mockFile = new File(['test'], '../evil.jpg', { type: 'image/jpeg' });
      
      const result = await prepareProfilePictureUpload(mockFile, 'guest-123');
      
      // Sanitizes by replacing non-alphanumeric (except .- ) with _
      expect(result.filePath).toBe('guest/guest-123/profile/.._evil.jpg');
      // Slashes are replaced with underscores
      expect(result.filePath).not.toContain('/evil');
    });

    it('should preserve content type', async () => {
      const pngFile = new File(['png'], 'image.png', { type: 'image/png' });
      const jpgFile = new File(['jpg'], 'image.jpg', { type: 'image/jpeg' });
      const webpFile = new File(['webp'], 'image.webp', { type: 'image/webp' });
      
      const pngResult = await prepareProfilePictureUpload(pngFile, 'guest-123');
      const jpgResult = await prepareProfilePictureUpload(jpgFile, 'guest-123');
      const webpResult = await prepareProfilePictureUpload(webpFile, 'guest-123');
      
      expect(pngResult.contentType).toBe('image/png');
      expect(jpgResult.contentType).toBe('image/jpeg');
      expect(webpResult.contentType).toBe('image/webp');
    });
  });
});

