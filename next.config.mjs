/** @type {import('next').NextConfig} */
const nextConfig = {
  // Off locally only: React 18 double-invokes effects in dev, which races
  // LiveAvatar's session creation against its concurrency=1 plan limit.
  // Production builds never double-invoke effects regardless of this flag.
  reactStrictMode: false,
};

export default nextConfig;
