/** @type {import('next').NextConfig} */

// Derive the Supabase storage hostname from NEXT_PUBLIC_SUPABASE_URL so we
// don't depend on a separate SUPABASE_STORAGE_HOSTNAME env var being set.
// Falls back to the known prod project hostname if the URL var is missing
// (so dev startup doesn't fail before env vars are pulled).
function getSupabaseHostname() {
  const fallback = 'tkgpmamrmxbctnbfdber.supabase.co';
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${fallback}`;
    return new URL(url).hostname;
  } catch {
    return fallback;
  }
}

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,

  // Server Actions body-size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },

  // Disable HMR file watching on the main form action — Next.js HMR was
  // corrupting FormData submissions during dev. Pre-existing fix from the
  // handoff doc; previously dead because of a duplicate webpack key below
  // that has now been removed.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/lib/guest-form-actions.ts']
      }
    }
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: getSupabaseHostname(),
        pathname: '/**',
      },
    ],
    qualities: [75, 95],
  },

  turbopack: {},
}

module.exports = nextConfig;
