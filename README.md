# Reactive Church Guest Registration System--

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
- **SMS & Email Notifications** - Automated notifications via TextMagic integration
- **QR Code Generation** - Secure passes for approved guests
- **Mobile Responsive** - Works seamlessly on phones, tablets, and desktop
- **Image Compression** - Automatic client-side photo compression for faster uploads

### User Roles
- **Admin** - Full access to all features, user management, and system configuration
- **Pre-Approver** - Can review and pre-approve guest registrations
- **Guest** - Can submit registration forms and check status

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

The system includes comprehensive unit tests for critical business logic:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:**
- Form validation and data parsing (16 tests)
- Data transformation utilities (18 tests)  
- Business logic workflows (17 tests)
- Utility functions (18 tests)

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
- **SMS/Email:** TextMagic API
- **Testing:** Jest with TypeScript support
- **Deployment:** Vercel-ready

## 📚 Documentation

- **[User Guide](USER_GUIDE.md)** - Complete guide for church staff
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Technical setup and development
- **[API Documentation](API_DOCS.md)** - Server actions and endpoints
- **[Testing Guide](lib/__tests__/README.md)** - Unit testing information

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical issues or questions:
1. Check the [User Guide](USER_GUIDE.md) for common tasks
2. Review the [Developer Guide](DEVELOPER_GUIDE.md) for technical issues
3. Open an issue on GitHub for bugs or feature requests

---

**Built with ❤️ for church communities**