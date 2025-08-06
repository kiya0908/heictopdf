import { MetadataRoute } from "next";

// import { allPosts } from "contentlayer/generated";  // 临时禁用

import { defaultLocale, locales, pathnames } from "@/config";
import { env } from "@/env.mjs";
import { getPathname } from "@/lib/navigation";

/**
 * Generate URLs for successful conversion results
 * DEPRECATED: This function is temporarily disabled due to database schema changes
 * The fluxData table has been removed from the database schema
 */

const getConversionUrls = async () => {
  // Return empty array since the flux system is deprecated
  return [];
}

/**
 * Generate sitemap for HEIC to PDF Converter
 * Includes static pages, blog posts, and public conversion results
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all static page routes
  const keys = Object.keys(pathnames) as Array<keyof typeof pathnames>;
  
  // 临时禁用博客文章，直到 contentlayer 修复
  const posts: string[] = [];
  // const posts = await Promise.all(
  //   allPosts
  //     .filter((post) => post.published && post.language === defaultLocale)
  //     .sort((a, b) => b.date.localeCompare(a.date))
  //     .map((post) => post.slug?.replace(`/${defaultLocale}`, "")),
  // );

  // Helper function to generate localized URLs
  function getUrl(
    key: keyof typeof pathnames | string,
    locale: (typeof locales)[number],
  ) {
    const pathname = getPathname({ locale, href: key as keyof typeof pathnames });
    return `${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/${locale === defaultLocale ? "" : locale}${pathname === "/" ? "" : pathname}`;
  }

  // Get public conversion result URLs
  const conversionUrls = await getConversionUrls();

  // Generate sitemap entries for all pages across all locales
  return [...posts, ...keys, ...conversionUrls].flatMap((key) =>
    locales.map((locale) => ({
      url: getUrl(key, locale),
      priority: key === "/" ? 1.0 : key.includes("/pricing") ? 0.9 : 0.7,
      changeFrequency: key.includes("/blog") ? "weekly" : "daily" as const,
      lastModified: new Date(),
    })),
  );
}
