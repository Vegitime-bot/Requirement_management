/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  async rewrites() {
    const backendUrl = 'http://100.73.184.77:8020';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*/`,
      },
    ];
  },
};

module.exports = nextConfig;
