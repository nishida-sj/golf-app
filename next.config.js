/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration for maximum compatibility
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable some optimizations that might cause issues
  experimental: {
    optimizePackageImports: [],
  },
  
  // Ensure proper handling of static files
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Logging for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;