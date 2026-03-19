import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ビルドエラーを無視する設定（開発効率優先）
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // PrismaとPDF解析ライブラリ、ブラウザ操作ライブラリを外部パッケージとして扱う
  serverExternalPackages: ["@prisma/client", "pdf-parse", "playwright", "playwright-core"],

  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'books.google.com',
        port: '',
        pathname: '/books/content/**',
      },
    ],
  },
};

export default nextConfig;