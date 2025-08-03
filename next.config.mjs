/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This allows requests from the specified origin in development.
    // The wildcard '*' makes it work for any cluster assigned to your workstation.
    allowedDevOrigins: ["https://*.cloudworkstations.dev"],
  },
};

export default nextConfig;
