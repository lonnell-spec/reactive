# PAM Special Guest Registration

A modern, secure guest registration system built for churches using Next.js, Supabase, and TextMagic. Features a two-step approval workflow, role-based administration, SMS/email notifications, and mobile-responsive design.

## 🚀 Quick Start

### For Users (Church Staff)
👉 **[User Guide](USER_GUIDE.md)** - How to use the system, create accounts, manage guests, and navigate the interface.

### For Developers
👉 **[Developer Guide](DEVELOPER_GUIDE.md)** - Technical setup, configuration, and development information.

## 📋 System Overview

### Core Features
- **Guest Registration Form** - Mobile-friendly form with photo uploads for guests and children
- **Two-Step Approval Workflow** - Pre-approval → Final approval process
- **Role-Based Administration** - Admin and pre-approver roles with different permissions
- **SMS Notifications** - Automated notifications via TextMagic integration
- **QR Code Generation** - Secure passes for approved guests
- **Mobile Responsive** - Works seamlessly on phones, tablets, and desktop
- **Image Compression** - Automatic client-side photo compression for faster uploads

### User Roles
- **Admin** - Gets Final Approval Notifications. Full access to all features, user management, and system configuration
- **Pre-Approver** - Gets Pre-Approver notifications. Full access to all features, user management, and system configuration

### Workflow
1. **Guest Submission** - Guests fill out registration form with photos
2. **Pre-Approval** - Pre-approvers receive notifications and review submissions
3. **Final Approval** - Admins review pre-approved guests and generate passes
4. **Guest Access** - Approved guests receive QR codes and access information

## 🛡️ Security Features

- **Supabase Authentication** - Secure user authentication and session management
- **Row Level Security (RLS)** - Database-level access controls
- **Role-Based Authorization** - Function-level permission checks
- **File Upload Validation** - Type and size restrictions on uploads
- **Form Validation** - Client and server-side input validation using Zod
- **Environment-Based Configuration** - Secure credential management

## 🧪 Testing

The system includes comprehensive tests for critical business logic:

### Unit Tests (Vitest)
Fast, isolated tests co-located with the code they test:

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:**
- Form validation and data parsing
- Data transformation utilities
- Business logic workflows
- Utility functions

### Integration Tests (Optional)
End-to-end tests against a remote Supabase instance:

```bash
# Run integration tests (requires env vars)
npm run test:integration
```

**Requirements for integration tests:**
- Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Tests use unique IDs and automatically clean up created data
- Safe to run against shared development Supabase instances
- Notifications are automatically disabled during tests

**Integration test coverage:**
- Guest submission happy path
- Guest submission rollback on failure
- Pass verification (valid, expired, used)
- Search by code word and phone number

## 📱 Mobile Support

- **Responsive Design** - Optimized for all screen sizes
- **Touch-Friendly Interface** - Large buttons and easy navigation
- **Image Compression** - Automatic photo resizing for mobile uploads
- **Offline-First Forms** - Client-side validation before submission

## 🔧 Technology Stack

- **Frontend:** Next.js 16, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **SMS:** TextMagic API
- **Testing:** Vitest with TypeScript support
- **Deployment:** Vercel-ready

## 📚 Documentation

- **[User Guide](USER_GUIDE.md)** - Complete guide for church staff
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Technical setup and development
- **[Date & Time Configuration](TIMEZONE_CONFIGURATION.md)** - Date handling and timezone information
- **[API Documentation](API_DOCS.md)** - Server actions and endpoints

## 🆘 Support

For technical issues or questions:
1. Check the [User Guide](USER_GUIDE.md) for common tasks
2. Review the [Developer Guide](DEVELOPER_GUIDE.md) for technical issues

---
