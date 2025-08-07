import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['cryptologos.cc', 'via.placeholder.com', 'example.com'],
  },
};

export default nextConfig;
