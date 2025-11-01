# Reactive Church Guest Registration

This is a Next.js application for Reactive Church Guest Registration. The application allows guests to register for church services, and administrators to approve or deny registrations.

## Features

- Guest registration form with photo upload
- Child registration with photo upload
- Two-step approval workflow (pre-approval and final approval)
- Role-based admin dashboard for managing registrations
- SMS notifications for pre-approval
- Status check for guests to see their registration status
- QR code generation for approved guests

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/reactive-church-guest-registration.git
cd reactive-church-guest-registration
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase URL and keys
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App configuration
APP_URL=http://localhost:3000

# Environment mode (development or production)
NODE_ENV=development

# TextMagic API credentials (for SMS notifications)
TEXTMAGIC_API_KEY=your-textmagic-api-key
TEXTMAGIC_USERNAME=your-textmagic-username

# Pre-approver phone number (E.164 format)
PRE_APPROVER_PHONE=+1234567890
```

### 4. Set up Supabase

1. Create a new Supabase project
2. Run the SQL scripts in the `supabase` directory to set up the database schema, RLS policies, and storage buckets:
   - `schema.sql` - Creates the database tables
   - `rls.sql` - Sets up Row Level Security policies
   - `storage.sql` - Creates the storage buckets for photos
3. See the detailed `SUPABASE_SETUP_GUIDE.md` for complete instructions on setting up user roles and testing the workflow

### 5. Set up TextMagic (for SMS notifications)

1. Create a TextMagic account at https://www.textmagic.com/
2. Get your API credentials from the TextMagic dashboard
3. Add them to your `.env.local` file

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Development Routes

For development purposes, the following routes are available:

- `/dev` - Development dashboard with links to all development routes
- `/dev/admin` - Pre-authenticated admin dashboard
- `/dev/status` - Status check page
- `/dev/qrcode` - QR code display
- `/dev/login` - Development login page

## Production Routes

- `/` - Guest registration form
- `/admin` - Admin dashboard (requires login)
- `/status` - Status check page

## Implementation Details

### Supabase Integration

The application uses Supabase for:
- Database storage (guests and children)
- File storage (profile pictures and child photos)
- Authentication (admin login)
- Role-based access control for the admin dashboard

### Role-Based Access Control

The Admin Dashboard implements role-based access control using Supabase JWT claims:
- **`pre_approver`**: Can view and update `pending_pre_approval` guests
- **`pending_approver`**: Can view and update `pending` guests
- **`admin`**: Can view and update all guests

Users can have multiple roles (e.g., `pre_approver,pending_approver`).

### TextMagic Integration

TextMagic is used for sending SMS notifications to pre-approvers when a new guest registration is submitted.

#### Development Mode

When `NODE_ENV` is set to `development` in your `.env.local` file, the application will not actually send SMS messages. Instead, it will log the message content to the console. This is useful for development and testing without incurring SMS costs or sending real messages.

Example console output in development mode:
```
========== TEXTMAGIC SMS (DEV MODE) ==========
To: +1234567890
Message:
New guest registration requires pre-approval:
Name: John Doe
Visit Date: 10/25/2025
Time: 10:30 AM
Guests: 2
Approve at: http://localhost:3000/admin
==============================================
```

### Pre-Approval Workflow

The guest registration system implements a two-step approval process:

1. **Pre-Approval**: When a guest submits a registration form, it's initially set to `pending_pre_approval` status. Pre-approvers receive an SMS notification and can review the submission in the admin dashboard. They can either pre-approve or deny the registration.

2. **Final Approval**: If pre-approved, the registration status changes to `pending`. Pending approvers can then review the submission and either approve or deny it. If approved, a QR code and codeword are generated for the guest.

### Transaction Handling

The guest registration process is implemented with proper transaction handling:
1. Insert guest record
2. Upload profile picture
3. Insert child records
4. Upload child photos
5. Send pre-approval notification

If any step fails, the process is rolled back using the Supabase service role key.

### Security

- The application uses Supabase Row Level Security to ensure data security
- The anon key is used for regular operations
- The service role key is used for rollback operations
- File uploads are validated for type and size
- Form data is validated using Zod

## License

This project is licensed under the MIT License - see the LICENSE file for details.