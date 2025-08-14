
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
                hostname: 'image.civitai.com',
            },
            {
                protocol: 'https',
                hostname: 'upload.wikimedia.org',
            }
        ]
    }
};

export default nextConfig;
