import { MetadataRoute } from "next";

import { defaultLocale, locales, pathnames } from "@/config";
import { env } from "@/env.mjs";
import { getPathname } from "@/lib/navigation";

/**
 * Generate sitemap for HEIC to PDF Converter
 * Includes static pages, blog posts, and public conversion results
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all static page routes
  const keys = Object.keys(pathnames) as Array<keyof typeof pathnames>;
  
  // Helper function to generate localized URLs
  function getUrl(
    key: keyof typeof pathnames | string,
    locale: (typeof locales)[number],
  ) {
    const pathname = getPathname({ locale, href: key as keyof typeof pathnames });
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://heic-to-pdf.pro';
    return `${baseUrl}/${locale === defaultLocale ? "" : locale}${pathname === "/" ? "" : pathname}`;
  }

  // Generate sitemap entries for all pages across all locales
  // By adding ": MetadataRoute.Sitemap", we explicitly tell TypeScript the type.
  const sitemapEntries: MetadataRoute.Sitemap = [...keys].flatMap((key) =>
    locales.map((locale) => ({
      url: getUrl(key, locale),
      priority: key === "/" ? 1.0 : key.includes("/pricing") ? 0.9 : 0.7,
      changeFrequency: key.includes("/blog") ? "weekly" : "daily",
      lastModified: new Date(),
    }))
  );

  // Also explicitly type rootUrls for consistency and safety.
  const rootUrls: MetadataRoute.Sitemap = [
    {
      url: "https://heic-to-pdf.pro",
      priority: 1.0,
      changeFrequency: "daily",
      lastModified: new Date(),
    },
    {
      url: "http://heic-to-pdf.pro",
      priority: 0.8,
      changeFrequency: "daily",
      lastModified: new Date(),
    }
  ];

  return [...rootUrls, ...sitemapEntries];
}