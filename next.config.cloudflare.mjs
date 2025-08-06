/**
 * Cloudflare Pages 专用的 Next.js 配置
 */
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import withNextIntl from "next-intl/plugin";

import("./env.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cloudflare 需要使用 unoptimized 或者配置适当的 loader
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        port: "",
      },
    ],
  },

  experimental: {
    taint: true,
  },
  
  // 使用重定向替代 rewrites（Cloudflare Pages 支持）
  async redirects() {
    return [
      {
        source: "/feed",
        destination: "/feed.xml",
        permanent: true,
      },
      {
        source: "/rss",
        destination: "/feed.xml",
        permanent: true,
      },
      {
        source: "/rss.xml",
        destination: "/feed.xml",
        permanent: true,
      },
    ];
  },
  
  webpack: (config) => {
    // Handle file types for HEIC processing
    config.module.rules.push({
      test: /\.(heic|heif)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files/',
          outputPath: 'static/files/',
        },
      },
    });

    return config;
  },
  
  // Cloudflare Pages 不完全支持 SSR，但支持 Edge Runtime
  // 我们保持默认配置，让 @cloudflare/next-on-pages 处理适配
};

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

export default withNextIntl()(nextConfig);