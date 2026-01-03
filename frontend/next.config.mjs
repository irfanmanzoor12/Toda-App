/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
      // Proxy all @vite resources (Vite HMR and modules) - @ needs to be escaped
      {
        source: '/:at([@])vite/:path*',
        destination: 'http://localhost:3300/@vite/:path*',
      },
      {
        source: '/:at([@])react-refresh',
        destination: 'http://localhost:3300/@react-refresh',
      },
      // Proxy all /src resources (ChatKit source files)
      {
        source: '/src/:path*',
        destination: 'http://localhost:3300/src/:path*',
      },
      // Proxy /assets and other static resources
      {
        source: '/assets/:path*',
        destination: 'http://localhost:3300/assets/:path*',
      },
      // Proxy /chat route
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
