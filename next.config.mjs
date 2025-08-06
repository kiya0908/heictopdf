/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import { withSentryConfig } from "@sentry/nextjs";
import { withContentlayer } from "next-contentlayer2";
import withNextIntl from "next-intl/plugin";

import("./env.mjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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

  async rewrites() {
    return [
      {
        source: "/feed",
        destination: "/feed.xml",
      },
      {
        source: "/rss",
        destination: "/feed.xml",
      },
      {
        source: "/rss.xml",
        destination: "/feed.xml",
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
};

// 应用所有配置包装器
let config = withContentlayer(nextConfig);
config = withNextIntl()(config);

// 启用 Sentry（在生产环境中）
if (process.env.NODE_ENV === 'production') {
  config = withSentryConfig(config, {
    // Sentry 配置选项
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  }, {
    // Sentry webpack 插件选项
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  });
}

export default config;