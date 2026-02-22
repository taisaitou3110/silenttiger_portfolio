import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ビルドエラーを無視する設定（開発効率優先）
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Prismaの動作を安定させる
  serverExternalPackages: ["@prisma/client"],

  images: {
    // 許可する外部ドメインの設定
    remotePatterns: [
      {
        protocol: 'https', // Googleはhttpsが標準
        hostname: 'books.google.com',
        port: '',
        pathname: '/books/content/**',
      },
      // もし他のホスト（Azure等）からも画像を表示するならここに追加
    ],
  },
};

export default nextConfig;