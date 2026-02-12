/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@construccion/shared'],
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Enable standalone output for Docker
  output: 'standalone',
};

module.exports = nextConfig;
