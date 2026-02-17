/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server Actions están habilitadas por defecto en Next.js 14+
  },
  images: {
    domains: [],
  },
  // Configuración para producción
  poweredByHeader: false,
}

module.exports = nextConfig
