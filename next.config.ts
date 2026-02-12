import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: {
    buildActivity: false,
  },
  // Disable Next.js banner and logo
  experimental: {
    disableOptimizedLoading: true,
  },
};

export default nextConfig;
