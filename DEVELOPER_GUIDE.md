# Developer Guide - Church Guest Registration System

This guide covers technical setup, configuration, and development information for the guest registration system.

## 🚀 Quick Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- TextMagic account (for SMS/email)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd reactive-church-guest-registration

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env.local

# Run development server
npm run dev
```

## 🔧 Environment Configuration

Create a `.env.local` file with the following variables:

### Supabase Configuration
```env
# Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Application Settings
```env
# Base URL for the application
APP_URL=http://localhost:3000

# Registration codes for user creation
ADMIN_REGISTRATION_CODE=your-secure-admin-code
REGISTRATION_CODE=your-general-registration-code

# Church contact information
CHURCH_CONTACT_EMAIL=contact@yourchurch.org
```

### TextMagic Integration
```env
# TextMagic API credentials
TEXTMAGIC_API_KEY=your-api-key
TEXTMAGIC_USERNAME=your-username
TEXTMAGIC_URL=https://rest.textmagic.com

# Notification control flags
SEND_TEXT_MESSAGES=true
SEND_EMAILS=true
NOTIFICATION_NOTIFY_GUESTS=true

# Live vs Test mode
NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS=false
NOTIFICATION_USE_ACTUAL_EMAIL_ADDRESSES=false

# Test recipients (comma-separated)
NOTIFICATION_TEST_PHONE_NUMBERS=+1234567890,+0987654321
NOTIFICATION_TEST_EMAIL_ADDRESSES=test1@example.com,test2@example.com
```

### Supabase Auth Configuration
```env
# Email/phone confirmation settings
SUPABASE_EMAIL_CONFIRMATION_CONFIGURED=false
SUPABASE_PHONE_CONFIRMATION_CONFIGURED=false
```

## 🗄️ Database Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and keys

### 2. Run Database Scripts

Execute these SQL scripts in your Supabase SQL editor:

```bash
# 1. Create database schema
supabase/schema.sql

# 2. Set up Row Level Security
supabase/rls.sql

# 3. Configure storage buckets
supabase/storage.sql
```

### 3. Database Schema Overview

**Main Tables:**
- `guests` - Guest registration data
- `children` - Child information linked to guests
- `users` - System users (admins, pre-approvers)

**Key Fields:**
- `external_guest_id` - UUID for guest identification
- `text_callback_reference_id` - 9-digit integer for SMS callbacks
- `status` - Guest approval status enum
- `expires_at` - Pass expiration timestamp

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend:** Next.js 16 with App Router
- **Styling:** Tailwind CSS with Radix UI components
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Forms:** React Hook Form with Zod validation
- **Testing:** Jest with TypeScript support

### Key Directories
```
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                    # Business logic and utilities
│   ├── __tests__/         # Unit tests
│   ├── *-actions.ts       # Server actions
│   ├── *-utils.ts         # Utility functions
│   └── types.ts           # TypeScript definitions
├── supabase/              # Database scripts
└── public/                # Static assets
```

### Server Actions Pattern
The app uses Next.js Server Actions for backend logic:
- `guest-form-actions.ts` - Guest registration handling
- `admin-actions.ts` - Admin operations (approve, deny)
- `user-management-actions.ts` - User role management
- `profile-client-actions.ts` - Profile updates

## 🔐 Authentication & Authorization

### User Roles System
Roles are stored as arrays in both `user_metadata.roles` and `app_metadata.roles`:

```typescript
// Example user metadata
{
  "roles": ["admin", "pre_approver"]
}
```

### Role Checking
```typescript
import { determineUserRoles } from '@/lib/user-role-utils';

const roles = await determineUserRoles(user);
if (roles.isAdmin) {
  // Admin-only functionality
}
```

### Registration Codes
- `ADMIN_REGISTRATION_CODE` - Creates users with admin role
- `REGISTRATION_CODE` - Creates users with no roles (must be assigned later)

## 📱 Image Handling

### Client-Side Compression
Images are automatically compressed before upload:
- **Max dimension:** 1080px
- **Quality:** 80% JPEG
- **Target size:** 300KB-800KB
- **Fallback:** Canvas API for older browsers

### Storage Structure
```
guest-photos/
├── guests/
│   └── profile-{uuid}.jpg
└── children/
    └── child-{uuid}.jpg
```

## 🔔 Notification System

### SMS/Email Flow
1. Guest submits registration
2. System determines recipients based on environment flags
3. Sends notifications via TextMagic API
4. Recipients can approve/deny via admin dashboard

### Test vs Live Mode
```typescript
// Test mode - uses test recipients
NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS=false
NOTIFICATION_TEST_PHONE_NUMBERS=+1234567890

// Live mode - uses actual user phone numbers
NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS=true
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure
- **Form Validation** - Input validation and parsing
- **Data Transformation** - Database mapping functions
- **Business Logic** - Core workflows and validation
- **Utility Functions** - Pure helper functions

### Writing Tests
Tests use dependency injection for testability:
```typescript
export async function myFunction(
  input: string,
  dependencies: {
    helperFn?: typeof defaultHelper;
  } = {}
) {
  const { helperFn = defaultHelper } = dependencies;
  // Function logic
}
```

## 🚀 Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables in Production
Ensure all environment variables are set in your deployment platform:
- Supabase credentials
- TextMagic API keys
- Registration codes
- Feature flags

### Build Configuration
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

## 🔧 Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch

# Check TypeScript
npm run type-check

# Lint code
npm run lint
```

### Code Organization

**Server Actions** - Use for database operations:
```typescript
'use server'

export async function myServerAction(formData: FormData) {
  // Server-side logic
}
```

**Client Components** - Use for interactive UI:
```typescript
'use client'

export default function MyComponent() {
  // Client-side logic
}
```

### Form Handling Pattern
1. **Zod Schema** - Define validation in `lib/types.ts`
2. **React Hook Form** - Handle form state
3. **Server Action** - Process submission
4. **Error Handling** - Display validation errors

## 📊 Monitoring & Debugging

### Logging
- Server actions log to console in development
- Use Vercel Analytics for production monitoring
- Supabase provides database query logs

### Common Issues

**Empty FormData in Server Actions:**
- Caused by Next.js HMR in development
- Fixed with webpack configuration in `next.config.js`

**Image Upload Failures:**
- Check `bodySizeLimit` in `next.config.js`
- Verify Supabase storage policies
- Ensure image compression is working

**Authentication Issues:**
- Verify Supabase RLS policies
- Check user role assignments
- Confirm environment variables

## 🔄 Data Flow

### Guest Registration Flow
1. **Form Submission** → Client validation → Server action
2. **Data Processing** → Parse FormData → Validate with Zod
3. **Database Insert** → Guest record → Upload photos → Insert children
4. **Notification** → Send SMS/email to pre-approvers
5. **Rollback** → On any failure, clean up database and storage

### Approval Flow
1. **Pre-Approval** → Update status → Notify approvers
2. **Final Approval** → Generate QR code → Create pass credentials
3. **Guest Notification** → Send approval confirmation

## 🛠️ Customization

### Adding New Fields
1. Update Zod schema in `lib/types.ts`
2. Add database columns in `supabase/schema.sql`
3. Update form components
4. Modify server actions to handle new fields

### Styling Changes
- Modify Tailwind classes in components
- Update `tailwind.config.js` for theme changes
- Use CSS variables for consistent theming

### Feature Flags
Control features via environment variables:
```env
SEND_TEXT_MESSAGES=false  # Disable SMS
SEND_EMAILS=false         # Disable email
NOTIFICATION_NOTIFY_GUESTS=false  # Disable guest notifications
```

## 📚 API Reference

### Server Actions

**Guest Management:**
- `submitGuestForm(formData)` - Submit new guest registration
- `approveGuest(guestId, userEmail)` - Approve guest and generate pass
- `denyGuest(guestId, userEmail)` - Deny guest registration
- `preApproveGuest(guestId, userEmail)` - Pre-approve guest

**User Management:**
- `updateUserRoles(userId, roles)` - Update user role assignments
- `updateUserProfile(email, phone)` - Update user profile information

### Utility Functions

**Validation:**
- `validateSignUpInputs()` - Validate registration form
- `isValidEmailFormat()` - Email format validation
- `isValidPhoneFormat()` - Phone number validation

**Data Transformation:**
- `mapFormDataToGuestRecord()` - Convert form to database record
- `generateQRExpiry()` - Calculate QR code expiration
- `compressImage()` - Client-side image compression

## 🤝 Contributing

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for business logic
- Use Prettier for formatting

### Pull Request Process
1. Create feature branch from `main`
2. Write/update tests for changes
3. Ensure all tests pass
4. Update documentation if needed
5. Submit PR with clear description

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
npm test

# Commit with descriptive message
git commit -m "feat: add new feature description"

# Push and create PR
git push origin feature/new-feature
```

---

**Questions?** Open an issue on GitHub or contact the development team.
