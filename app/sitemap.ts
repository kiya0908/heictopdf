import { MetadataRoute } from "next";
import { prisma } from "@/db/prisma";
import { FluxTaskStatus } from "@/db/type";
import { FluxHashids } from "@/db/dto/flux.dto";

import { allPosts } from "contentlayer/generated";

import { defaultLocale, locales, pathnames } from "@/config";
import { env } from "@/env.mjs";
import { getPathname } from "@/lib/navigation";

/**
 * Generate URLs for successful conversion results
 * These are public conversion results that can be indexed by search engines
 */

const getConversionUrls = async () => {
  const conversions = await prisma.fluxData.findMany({
    where: {
      isPrivate: false,
      taskStatus: {
        in: [FluxTaskStatus.Succeeded],
      },
    },
    select: {
      id: true
    }
  });
  return conversions.map((conversion) => `/d/${FluxHashids.encode(conversion.id)}`)
}
/**
 * Generate sitemap for HEIC to PDF Converter
 * Includes static pages, blog posts, and public conversion results
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all static page routes
  const keys = Object.keys(pathnames) as Array<keyof typeof pathnames>;
  
  // Get published blog posts
  const posts = await Promise.all(
    allPosts
      .filter((post) => post.published && post.language === defaultLocale)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((post) => post.slug?.replace(`/${defaultLocale}`, "")),
  );

  // Helper function to generate localized URLs
  function getUrl(
    key: keyof typeof pathnames,
    locale: (typeof locales)[number],
  ) {
    const pathname = getPathname({ locale, href: key });
    return `${env.NEXT_PUBLIC_SITE_URL}/${locale === defaultLocale ? "" : locale}${pathname === "/" ? "" : pathname}`;
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
