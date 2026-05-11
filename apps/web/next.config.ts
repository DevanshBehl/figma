import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  transpilePackages: ['@aether/types', '@aether/ui'],
  experimental: {
    turbo: {
      root: path.resolve(__dirname, '../..'),
    },
  },
};

export default nextConfig;
