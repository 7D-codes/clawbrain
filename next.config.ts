import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Get gateway URL from env or default
    const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:18789';
    
    return [
      {
        source: '/api/gateway/:path*',
        destination: `${gatewayUrl}/:path*`,
      },
    ];
  },
  // Add CORS headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-openclaw-agent-id' },
        ],
      },
    ];
  },
};

export default nextConfig;
