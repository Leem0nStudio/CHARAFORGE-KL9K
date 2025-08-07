
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'image.civitai.com',
            }
        ],
    },
    experimental: {
        // This is recommended for optimal performance with the App Router.
        allowedNextBundlerReactRoot: true,
    },
};

export default nextConfig;
