/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // No external image domains yet — all imagery is local/placeholder until
    // real product photography is added to /public/products.
    remotePatterns: [],
  },
};

module.exports = nextConfig;
