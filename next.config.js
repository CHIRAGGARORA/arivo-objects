/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // No external image domains yet — all imagery is local/placeholder until
    // real product photography is added to /public/products.
    remotePatterns: [],
  },
  // Preview/test deployments (including test.arivoobjects.com) must never be
  // indexed; only the production deployment is.
  async headers() {
    if (process.env.VERCEL_ENV === "production") return [];
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

module.exports = nextConfig;
