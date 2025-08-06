/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";
import { withSentryConfig } from "@sentry/nextjs";
import { withContentlayer } from "next-contentlayer2";
import withNextIntl from "next-intl/plugin";

import("./env.mjs");

// 检查是否是 Cloudflare 构建环境
const isCloudflareEnv = process.env.CF_PAGES || process.env.CLOUDFLARE_ENV;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Cloudflare 环境下使用 unoptimized
    ...(isCloudflareEnv ? { unoptimized: true } : {}),
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

  // Cloudflare 使用 redirects，其他环境使用 rewrites
  ...(isCloudflareEnv ? {
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
  } : {
    rewrites() {
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
  }),

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

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform();
}

// 应用所有配置包装器
let config = withContentlayer(nextConfig);
config = withNextIntl()(config);

// 只在非 Cloudflare 环境中启用 Sentry
if (!isCloudflareEnv) {
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
