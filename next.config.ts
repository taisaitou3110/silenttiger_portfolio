import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // サーバーサイドのプロセスに変数を明示的にバインドする
  serverExternalPackages: ["@prisma/client"],
  env: {
    DATABASE_URL: process.env.DATABASE_URL || "",
  }
};

export default nextConfig;