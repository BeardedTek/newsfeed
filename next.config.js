/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  // Set the hostname to 0.0.0.0 to accept connections from all interfaces
  server: {
    hostname: '0.0.0.0',
    port: 3000,
  },
}

module.exports = nextConfig 