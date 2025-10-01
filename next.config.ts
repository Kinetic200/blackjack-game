import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },
  // Generate unique build IDs to bust cache
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
};

export default nextConfig;
