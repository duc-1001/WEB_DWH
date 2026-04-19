/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Tat persistent cache cua Turbopack tren Windows de tranh loi SST file corruption
    turbopackFileSystemCacheForDev: false,
  },
}

export default nextConfig
