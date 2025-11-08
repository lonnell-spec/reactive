/**
 * Unit tests for data transformation utilities
 * Tests critical data mapping and transformation functions
 */

import { 
  mapFormDataToGuestRecord, 
  generateQRExpiry, 
  mapChildInfoToRecord,
  createGuestProfileUpdateRecord,
  createChildPhotoUpdateRecord
} from '../database-utils';
import { GuestFormData, GuestStatus } from '../types';

describe('Data Transformation', () => {
  describe('mapFormDataToGuestRecord', () => {
    const mockFormData: GuestFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      visitDate: '2025-12-25',
      gatheringTime: '10:30 AM',
      totalGuests: '2',
      hasChildrenForFormationKids: true,
      childrenInfo: [],
      carType: 'SUV',
      vehicleColor: 'Blue',
      vehicleMake: 'Toyota',
      vehicleModel: 'Highlander',
      foodAllergies: 'None',
      specialNeeds: 'None',
      additionalNotes: 'Looking forward to visiting',
      profilePicture: new File([''], 'test.jpg', { type: 'image/jpeg' })
    };

    it('should map form data to database record correctly', async () => {
      const result = await mapFormDataToGuestRecord(mockFormData);

      expect(result).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        visit_date: '2025-12-25',
        gathering_time: '10:30 AM',
        total_guests: '2',
        should_enroll_children: true,
        vehicle_type: 'SUV',
        vehicle_color: 'Blue',
        vehicle_make: 'Toyota',
        vehicle_model: 'Highlander',
        food_allergies: 'None',
        special_needs: 'None',
        additional_notes: 'Looking forward to visiting',
        status: GuestStatus.PENDING_PRE_APPROVAL,
        expires_at: undefined,
        text_callback_reference_id: undefined
      });
    });

    it('should include optional fields when provided', async () => {
      const expiresAt = '2025-12-31T23:59:59.999Z';
      const textCallbackReferenceId = 123456789;

      const result = await mapFormDataToGuestRecord(
        mockFormData, 
        expiresAt, 
        textCallbackReferenceId
      );

      expect(result.expires_at).toBe(expiresAt);
      expect(result.text_callback_reference_id).toBe(textCallbackReferenceId);
    });

    it('should handle false boolean values correctly', async () => {
      const formDataWithoutChildren = {
        ...mockFormData,
        hasChildrenForFormationKids: false
      };

      const result = await mapFormDataToGuestRecord(formDataWithoutChildren);
      expect(result.should_enroll_children).toBe(false);
    });

    it('should handle empty string values', async () => {
      const formDataWithEmptyStrings = {
        ...mockFormData,
        foodAllergies: '',
        specialNeeds: '',
        additionalNotes: ''
      };

      const result = await mapFormDataToGuestRecord(formDataWithEmptyStrings);
      expect(result.food_allergies).toBe('');
      expect(result.special_needs).toBe('');
      expect(result.additional_notes).toBe('');
    });
  });

  describe('generateQRExpiry', () => {
    const mockDate = new Date('2025-01-01T00:00:00.000Z');
    const mockDateProvider = () => mockDate;

    it('should generate expiry date 30 days from now by default', async () => {
      const result = await generateQRExpiry(30, mockDateProvider);
      const expectedDate = new Date('2025-01-31T00:00:00.000Z');
      expect(result).toBe(expectedDate.toISOString());
    });

    it('should generate expiry date for custom number of days', async () => {
      const result = await generateQRExpiry(7, mockDateProvider);
      const expectedDate = new Date('2025-01-08T00:00:00.000Z');
      expect(result).toBe(expectedDate.toISOString());
    });

    it('should throw error for non-positive days', async () => {
      await expect(generateQRExpiry(0, mockDateProvider)).rejects.toThrow('Days from now must be positive');
      await expect(generateQRExpiry(-5, mockDateProvider)).rejects.toThrow('Days from now must be positive');
    });

    it('should handle leap year correctly', async () => {
      const leapYearDate = new Date('2024-02-28T00:00:00.000Z');
      const leapYearProvider = () => leapYearDate;
      
      const result = await generateQRExpiry(1, leapYearProvider);
      const expectedDate = new Date('2024-02-29T00:00:00.000Z');
      expect(result).toBe(expectedDate.toISOString());
    });

    it('should handle month boundary correctly', async () => {
      const endOfMonth = new Date('2025-01-31T00:00:00.000Z');
      const endOfMonthProvider = () => endOfMonth;
      
      const result = await generateQRExpiry(1, endOfMonthProvider);
      const expectedDate = new Date('2025-02-01T00:00:00.000Z');
      expect(result).toBe(expectedDate.toISOString());
    });
  });

  describe('mapChildInfoToRecord', () => {
    const mockChild = {
      name: 'Jane Doe',
      dob: '2015-05-15',
      allergies: 'Peanuts'
    };

    it('should map child info to database record correctly', async () => {
      const result = await mapChildInfoToRecord(mockChild, 'guest-123');

      expect(result).toEqual({
        guest_id: 'guest-123',
        name: 'Jane Doe',
        dob: '2015-05-15',
        allergies: 'Peanuts'
      });
    });

    it('should handle missing allergies field', async () => {
      const childWithoutAllergies = {
        name: 'John Doe Jr',
        dob: '2018-03-10'
      };

      const result = await mapChildInfoToRecord(childWithoutAllergies, 'guest-456');
      expect(result.allergies).toBe('');
    });

    it('should throw error for missing guest ID', async () => {
      await expect(mapChildInfoToRecord(mockChild, '')).rejects.toThrow('Guest ID is required');
    });

    it('should handle empty allergies string', async () => {
      const childWithEmptyAllergies = {
        ...mockChild,
        allergies: ''
      };

      const result = await mapChildInfoToRecord(childWithEmptyAllergies, 'guest-789');
      expect(result.allergies).toBe('');
    });
  });

  describe('createGuestProfileUpdateRecord', () => {
    it('should create profile update record correctly', async () => {
      const profilePath = 'guests/profile-123.jpg';
      const result = await createGuestProfileUpdateRecord(profilePath);

      expect(result).toEqual({
        photo_path: 'guests/profile-123.jpg'
      });
    });

    it('should throw error for empty profile path', async () => {
      await expect(createGuestProfileUpdateRecord('')).rejects.toThrow('Profile path is required');
    });

    it('should handle complex file paths', async () => {
      const complexPath = 'guests/2025/01/profile-abc-123-def.jpg';
      const result = await createGuestProfileUpdateRecord(complexPath);
      expect(result.photo_path).toBe(complexPath);
    });
  });

  describe('createChildPhotoUpdateRecord', () => {
    it('should create child photo update record correctly', async () => {
      const photoPath = 'children/child-456.jpg';
      const result = await createChildPhotoUpdateRecord(photoPath);

      expect(result).toEqual({
        photo_path: 'children/child-456.jpg'
      });
    });

    it('should throw error for empty photo path', async () => {
      await expect(createChildPhotoUpdateRecord('')).rejects.toThrow('Photo path is required');
    });

    it('should handle complex file paths', async () => {
      const complexPath = 'children/2025/01/child-xyz-789-abc.jpg';
      const result = await createChildPhotoUpdateRecord(complexPath);
      expect(result.photo_path).toBe(complexPath);
    });
  });
});
