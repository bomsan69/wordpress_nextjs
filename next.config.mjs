/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kseniorusa.org',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
