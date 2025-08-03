/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的サイト生成用の設定
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // サーバーサイド機能を無効化
  experimental: {
    esmExternals: true
  }
};

module.exports = nextConfig;