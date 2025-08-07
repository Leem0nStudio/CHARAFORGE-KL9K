/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedNextBundlerReactRoot: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.civitai.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
