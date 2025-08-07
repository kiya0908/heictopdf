import { LocalePrefix, Pathnames } from "next-intl/routing";

export const defaultLocale = "en" as const;
export const locales = [
  "en",
  "zh",
  // Temporarily disabled languages - will be enabled later
  // "tw",
  // "fr",
  // "ja",
  // "ko",
  // "de",
  // "pt",
  // "es",
  // "ar",
] as const;

export type Locale = (typeof locales)[number];

// Pathnames configuration for all possible routes
export const pathnames = {
  "/": "/",
  "/privacy-policy": "/privacy-policy",
  "/terms-of-use": "/terms-of-use",
  "/pricing": "/pricing",
  "/blog": "/blog",
  "/support": "/support",
  "/docs": "/docs",
  "/guides": "/guides",
  "/projects": "/projects",
  "/tool": "/tool",
  "/app": "/app",
  "/app/generate": "/app/generate",
  "/app/history": "/app/history",
  "/app/giftcode": "/app/giftcode",
  "/app/order": "/app/order",
  "/docs/installation": "/docs/installation",
  "/docs/configuration/database": "/docs/configuration/database",
  "/docs/configuration/subscriptions": "/docs/configuration/subscriptions",
  "/docs/configuration/config-files": "/docs/configuration/config-files",
  "/docs/configuration/markdown-files": "/docs/configuration/markdown-files",
  "/docs/configuration/authentification": "/docs/configuration/authentification",
  "/docs/configuration/email": "/docs/configuration/email",
  "/docs/configuration/components": "/docs/configuration/components",
} satisfies Pathnames<typeof locales>;

export const localePrefix = "as-needed" satisfies LocalePrefix<typeof locales>;

export const port = process.env.PORT || 3000;
export const host = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${port}`;
