/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
      {
        source: '/chat',
        destination: 'http://localhost:3300',
      },
      {
        source: '/chat/:path*',
        destination: 'http://localhost:3300/:path*',
      },
    ];
  },
};

export default nextConfig;
