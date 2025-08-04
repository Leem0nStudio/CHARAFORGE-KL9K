/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // This is required to allow the Next.js dev server to accept requests from
    // the Firebase Studio development environment.
    allowedDevOrigins: [
      'https://*.cloudworkstations.dev',
      'https://*.firebase.studio',
 'https://6000-firebase-studio-1754169133945.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev',
 'https://9000-firebase-studio-1754169133945.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev',
    ],
  },
};

export default nextConfig;
