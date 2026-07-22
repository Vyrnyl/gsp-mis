/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['src'],
  },
  async rewrites() {
    // The BFF layer (Phase 1.1) will proxy to the API; keep the origin in one place.
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.API_ORIGIN ?? 'http://localhost:4000'}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
