/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // o "10mb" si prefieres
    },
  },
};

module.exports = nextConfig;

