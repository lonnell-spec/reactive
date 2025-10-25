# Reactive Church Guest Registration

This is a Next.js application for Reactive Church Guest Registration. The application allows guests to register for church services, and administrators to approve or deny registrations.

## Features

- Guest registration form with photo upload
- Child registration with photo upload
- Admin dashboard for managing registrations
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
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App configuration
APP_URL=http://localhost:3000

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

### TextMagic Integration

TextMagic is used for sending SMS notifications to pre-approvers when a new guest registration is submitted.

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