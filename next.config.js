/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Support for trailing slashes in routes
  trailingSlash: false,
  // Configure Server Actions body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  // Disable HMR for Server Actions to prevent FormData corruption
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/lib/guest-form-actions.ts']
      }
    }
    return config;
  },
  // Updated images configuration with remotePatterns instead of domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.SUPABASE_STORAGE_HOSTNAME,
        pathname: '**',
      },
    ],
    // Configure image qualities to prevent console warnings
    qualities: [75, 95],
  },
  // Add empty Turbopack config to silence the warning
  turbopack: {},
  // Configure webpack if needed for specific dependencies
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig;
