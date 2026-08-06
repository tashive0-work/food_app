/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    APP_VERSION: process.env.npm_package_version || "1.0.0",
  },
};

export default nextConfig;
