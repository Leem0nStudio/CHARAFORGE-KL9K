
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
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
            {
                protocol: 'https',
                hostname: 'image.civitai.com',
                port: '',
                pathname: '/**',
            }
        ],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin",
                    },
                    {
                        key: "Cross-Origin-Embedder-Policy",
                        value: "require-corp",
                    },
                ],
            },
        ]
    },
    // This is required for the Cloud Workstations live preview to work.
    // In a real production deployment, this might be removed or configured differently.
    // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
    ...(process.env.NODE_ENV === 'development'
        ? {
            experimental: {
                allowedDevOrigins: ['*'],
            },
        }
        : {}),
};

export default nextConfig;
