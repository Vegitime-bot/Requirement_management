/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://100.73.184.77:8010/:path*',
      },
    ]
  },
}

module.exports = nextConfig
