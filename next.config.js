/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['www.juniorrailers.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
}

module.exports = nextConfig
