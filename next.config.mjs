/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is required to allow the Next.js dev server to be proxied in the Studio editor.
    allowedDevOrigins: ['https://*.cloudworkstations.dev'],
  },
  // This is required to enable streaming in the Studio editor.
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
