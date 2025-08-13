
/** @type {import('next').NextConfig} */
const nextConfig = {
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
                hostname: 'placehold.co',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
                port: '',
                pathname: '/**',
            }
        ],
    },
    experimental: {
        allowedDevOrigins: ['9000-firebase-charaforgestudio-1754922151018.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev'],
        allowedDevOrigins: ['6000-firebase-charaforgestudio-1754922151018.cluster-kc2r6y3mtba5mswcmol45orivs.cloudworkstations.dev'],
    },
};

export default nextConfig;
