/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  // Fix for Vercel build issue with (public) route group
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Additional build optimization
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('_http_common')
    }
    return config
  },
}

export default nextConfig
