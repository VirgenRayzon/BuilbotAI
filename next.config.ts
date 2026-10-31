import type { NextConfig } from 'next';

import path from 'path';

const nextConfig: NextConfig = {
  // Browser verification uses its own build output so a normal dev server cannot
  // overwrite the emulator client's compiled Firebase configuration.
  distDir: process.env.QR_INVENTORY_TEST === 'true' ? '.next-qr-test' : '.next',
  async headers() {
    return process.env.QR_INVENTORY_TEST === 'true' ? [{ source: '/:path*', headers: [{ key: 'X-Buildbot-QR-Test', value: 'demo-buildbot-qr' }] }] : [];
  },
  /* config options here */
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    '/landing-video/*': ['./public/videos/*.mp4'],
  },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;
