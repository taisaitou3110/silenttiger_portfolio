import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ビルド時のESLintチェックを無視する
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // serverExternalPackages: ['better-sqlite3'], // Removed as it's no longer needed
  },
};

export default nextConfig;
