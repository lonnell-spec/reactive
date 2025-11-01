/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Support for trailing slashes in routes
  trailingSlash: false,
  // Updated images configuration with remotePatterns instead of domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tkgpmamrmxbctnbfdber.supabase.co',
        pathname: '**',
      },
    ],
  },
  // Add empty Turbopack config to silence the warning
  turbopack: {},
  // Configure webpack if needed for specific dependencies
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig;
