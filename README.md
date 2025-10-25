# Reactive Church Guest Registration - Next.js Edition

This is a Next.js migration of the Reactive Church Guest Registration application. The original project is available at https://www.figma.com/design/PoWK8f2lm1fUIoPs7hQPwH/Reactive-Church-Guest-Registration.

## Running the code

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Create a .env.local file with the following variables
NEXT_PUBLIC_SUPABASE_URL=https://oigtjjfydtbbttxxvywb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZ3RqamZ5ZHRiYnR0eHh2eXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMDAxNzAsImV4cCI6MjA3NDU3NjE3MH0.MjrkBa6UzcpL1Ot9jAcdI5gqWh0zsMzSLqet08hMOFI
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Start the production server:
```bash
npm run start
```

## Project Structure

- `/app` - Next.js App Router pages and layouts
- `/components` - React components 
- `/components/ui` - UI components library
- `/public` - Static assets
- `/utils` - Utility functions and Supabase integration

## Routes

- `/` - Guest registration form
- `/admin` - Admin dashboard (requires authentication)
- `/status` - Status check page

## Technologies

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase for authentication and database
- Radix UI components