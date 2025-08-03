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

// Simplified pathnames for current locale setup
export const pathnames = {
  "/": "/",
  "/privacy-policy": "/privacy-policy",
  "/terms-of-use": "/terms-of-use",
} satisfies Pathnames<typeof locales>;

export const localePrefix: LocalePrefix<typeof locales> = "as-needed";

export const port = process.env.PORT || 3000;
export const host = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${port}`;
