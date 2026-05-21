/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const backendUrl = 'http://100.73.184.77:8020';
    return [
      // ingest endpoints: FastAPI expects NO trailing slash
      {
        source: '/api/ingest/:path*',
        destination: `${backendUrl}/ingest/:path*`,
      },
      // single item endpoints (GET/PATCH/DELETE by ID): FastAPI expects NO trailing slash
      // These MUST come before the generic /api/:path* rule
      {
        source: '/api/products/:id',
        destination: `${backendUrl}/products/:id`,
      },
      {
        source: '/api/variants/:id',
        destination: `${backendUrl}/variants/:id`,
      },
      {
        source: '/api/categories/:id',
        destination: `${backendUrl}/categories/:id`,
      },
      {
        source: '/api/requirements/:id',
        destination: `${backendUrl}/requirements/:id`,
      },
      {
        source: '/api/versions/:id',
        destination: `${backendUrl}/versions/:id`,
      },
      {
        source: '/api/health',
        destination: `${backendUrl}/health`,
      },
      // all other list endpoints: FastAPI expects trailing slash
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*/`,
      },
    ];
  },
};

module.exports = nextConfig;
