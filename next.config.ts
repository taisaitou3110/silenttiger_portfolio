import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // サーバーサイドで環境変数を明示的に許可する設定
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "",
  }
};

export default nextConfig;