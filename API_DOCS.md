# API Documentation

This document covers the server actions and key functions available in the Church Guest Registration System.

## Server Actions

### Guest Management

#### `submitGuestForm(formData: FormData)`
**Purpose**: Process new guest registration submissions  
**Location**: `lib/guest-form-actions.ts`  
**Access**: Public (anonymous users)

**Parameters:**
- `formData` - FormData object containing guest information and photos

**Returns:**
```typescript
{
  success: boolean;
  submissionId?: string;
  message: string;
}
```

**Process:**
1. Validates and parses form data
2. Inserts guest record with `PENDING_PRE_APPROVAL` status
3. Uploads profile and children photos
4. Sends notifications to pre-approvers
5. Rolls back on any failure

---

#### `preApproveGuest(guestId: string, userEmail: string)`
**Purpose**: Pre-approve a guest registration  
**Location**: `lib/admin-actions.ts`  
**Access**: Pre-approvers and Admins

**Parameters:**
- `guestId` - UUID of the guest record
- `userEmail` - Email of the user performing the action

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Process:**
1. Updates guest status to `PENDING`
2. Records pre-approval details
3. Sends notifications to approvers and guest

---

#### `approveGuest(guestId: string, userEmail: string)`
**Purpose**: Give final approval and generate pass credentials  
**Location**: `lib/admin-actions.ts`  
**Access**: Admins only

**Parameters:**
- `guestId` - UUID of the guest record
- `userEmail` - Email of the admin performing the action

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Process:**
1. Generates unique QR code and code word
2. Updates guest status to `APPROVED`
3. Sets pass expiration date
4. Sends approval notification to guest

---

#### `denyGuest(guestId: string, userEmail: string, denialMessage?: string)`
**Purpose**: Deny a guest registration  
**Location**: `lib/admin-actions.ts`  
**Access**: Pre-approvers and Admins (based on guest status)

**Parameters:**
- `guestId` - UUID of the guest record
- `userEmail` - Email of the user performing the action
- `denialMessage` - Optional custom denial message

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Process:**
1. Updates guest status to appropriate denial status
2. Records denial details
3. Sends denial notification to guest

---

### User Management

#### `updateUserRoles(userId: string, roles: string[])`
**Purpose**: Update user role assignments  
**Location**: `lib/user-management-actions.ts`  
**Access**: Admins only

**Parameters:**
- `userId` - UUID of the user to update
- `roles` - Array of roles to assign (`['admin']`, `['pre_approver']`, etc.)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

#### `updateUserProfile(email?: string, phone?: string)`
**Purpose**: Update current user's profile information  
**Location**: `lib/profile-client-actions.ts`  
**Access**: Authenticated users (own profile only)

**Parameters:**
- `email` - New email address (if email confirmation disabled)
- `phone` - New phone number (if phone confirmation disabled)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

### Authentication

#### `signInUser(email: string, password: string)`
**Purpose**: Authenticate user login  
**Location**: `lib/auth-client-actions.ts`  
**Access**: Public

**Parameters:**
- `email` - User's email address
- `password` - User's password

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  user?: User;
}
```

---

#### `registerUser(email: string, password: string, confirmPassword: string, phone: string, adminCode: string)`
**Purpose**: Create new user account  
**Location**: `lib/auth-client-actions.ts`  
**Access**: Public (with valid registration code)

**Parameters:**
- `email` - User's email address
- `password` - User's password
- `confirmPassword` - Password confirmation
- `phone` - User's phone number
- `adminCode` - Registration code (determines role assignment)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  userId?: string;
}
```

---

## Utility Functions

### Validation

#### `validateSignUpInputs(email, password, confirmPassword, phone, adminCode)`
**Purpose**: Validate user registration form inputs  
**Location**: `lib/auth-client-actions.ts`  
**Type**: Pure function

**Returns:**
```typescript
{
  isValid: boolean;
  message: string;
}
```

---

#### `isValidEmailFormat(email: string)`
**Purpose**: Validate email format  
**Location**: `lib/string-utils.ts`  
**Type**: Pure function

**Returns:** `Promise<boolean>`

---

#### `isValidPhoneFormat(phone: string)`
**Purpose**: Validate 10-digit phone number format  
**Location**: `lib/string-utils.ts`  
**Type**: Pure function

**Returns:** `Promise<boolean>`

---

### Data Transformation

#### `mapFormDataToGuestRecord(parsedData, expiresAt?, textCallbackReferenceId?)`
**Purpose**: Convert form data to database record format  
**Location**: `lib/database-utils.ts`  
**Type**: Pure function

**Parameters:**
- `parsedData` - Validated form data object
- `expiresAt` - Optional expiry timestamp
- `textCallbackReferenceId` - Optional SMS callback reference

**Returns:** Database record object

---

#### `generateQRExpiry(daysFromNow?, dateProvider?)`
**Purpose**: Calculate QR code expiration date  
**Location**: `lib/database-utils.ts`  
**Type**: Pure function

**Parameters:**
- `daysFromNow` - Number of days until expiry (default: 30)
- `dateProvider` - Date function for testing (default: `() => new Date()`)

**Returns:** `Promise<string>` - ISO timestamp

---

### Image Processing

#### `compressImage(file: File)`
**Purpose**: Compress image files for upload  
**Location**: `lib/image-compression-utils.ts`  
**Type**: Client-side function

**Parameters:**
- `file` - Image file to compress

**Returns:** `Promise<File>` - Compressed image file

**Settings:**
- Max dimension: 1080px
- Quality: 80%
- Target size: 300KB-800KB

---

## Error Handling

### Standard Error Response
All server actions return a consistent error format:

```typescript
{
  success: false;
  message: string; // User-friendly error message
}
```

### Common Error Types

**Authentication Errors:**
- `"Unauthorized: User not authenticated"`
- `"Forbidden: User does not have required role"`

**Validation Errors:**
- `"Invalid email address"`
- `"Phone number must be exactly 10 digits"`
- `"Password must be at least 8 characters"`

**Database Errors:**
- `"Database error: [specific error message]"`
- `"Guest not found"`
- `"Failed to upload file"`

**Business Logic Errors:**
- `"Guest is not in correct status for this action"`
- `"Invalid registration code"`
- `"File size exceeds limit"`

---

## Rate Limiting & Security

### File Upload Limits
- **Max file size**: 10MB per file
- **Allowed types**: JPEG, PNG, WebP
- **Compression**: Automatic client-side compression
- **Storage**: Supabase Storage with RLS policies

### Authentication
- **Session-based**: Supabase Auth sessions
- **Role-based access**: Function-level authorization checks
- **RLS policies**: Database-level row security

### Input Validation
- **Client-side**: React Hook Form with Zod validation
- **Server-side**: Zod schema validation on all inputs
- **Sanitization**: Automatic escaping of user inputs

---

## Environment Configuration

### Required Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Application
APP_URL=
ADMIN_REGISTRATION_CODE=
REGISTRATION_CODE=
CHURCH_CONTACT_EMAIL=

# TextMagic (optional)
TEXTMAGIC_API_KEY=
TEXTMAGIC_USERNAME=
TEXTMAGIC_URL=
```

### Feature Flags
```env
# Notification control
SEND_TEXT_MESSAGES=true
SEND_EMAILS=true
NOTIFICATION_NOTIFY_GUESTS=true

# Test vs Live mode
NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS=false
NOTIFICATION_USE_ACTUAL_EMAIL_ADDRESSES=false

# Test recipients
NOTIFICATION_TEST_PHONE_NUMBERS=+1234567890
NOTIFICATION_TEST_EMAIL_ADDRESSES=test@example.com
```

---

## Testing

### Unit Tests
Run comprehensive unit tests covering:
- Form validation functions
- Data transformation utilities
- Business logic workflows
- Utility functions

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Manual Testing
1. **Guest Registration**: Submit forms with various data
2. **Admin Workflow**: Test pre-approval and final approval flows
3. **User Management**: Test role assignments and profile updates
4. **Error Handling**: Test validation and error scenarios

---

For implementation details, see the [Developer Guide](DEVELOPER_GUIDE.md).  
For user instructions, see the [User Guide](USER_GUIDE.md).
