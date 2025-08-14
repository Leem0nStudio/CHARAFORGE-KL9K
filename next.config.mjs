/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'cdn.openai.com',
            },
             {
                protocol: 'https',
                hostname: 'cdn.iconscout.com',
            },
            {
                protocol: 'https',
                hostname: 'image.civitai.com',
            }
        ],
    },
};

export default nextConfig;
