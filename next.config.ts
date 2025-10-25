/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',       // allows any hostname (useful for Stripe images)
        port: '',             // leave empty
        pathname: '/**',      // allow all paths
      },
    ],
  },
};

module.exports = nextConfig;
