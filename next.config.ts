import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint と typescript の無視設定を 16 の形式に合わせます
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack の設定（16 ではこちらが推奨）
  experimental: {
    turbo: {
      // 警告を減らすための設定（空でもOK）
    },
  },
};

export default nextConfig;