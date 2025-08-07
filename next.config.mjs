/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This is required to fix an issue with React 19 and the Next.js bundler.
    allowedNextBundlerReactRoot: true,
  },
};

export default nextConfig;

// Updated to trigger a rebuild and fix module not found error.
