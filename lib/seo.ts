import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";

/**
 * 生成标准SEO元数据
 * 确保所有页面都有正确的索引设置
 */
export async function generateSEOMetadata({
  locale,
  title,
  description,
  keywords,
  noIndex = false,
  image,
  url,
}: {
  locale: string;
  title?: string;
  description?: string;
  keywords?: string[];
  noIndex?: boolean;
  image?: string;
  url?: string;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "LocaleLayout" });
  
  const pageTitle = title || t("title");
  const pageDescription = description || t("description");
  const pageKeywords = keywords || t("keywords")?.split(",") || [];
  const pageImage = image || siteConfig.ogImage;
  const pageUrl = url || `/${locale === "en" ? "" : locale}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: pageUrl,
      siteName: siteConfig.name,
      locale: locale,
      type: 'website',
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        "x-default": "/",
        zh: "/zh",
        tw: "/tw",
        ja: "/ja",
        fr: "/fr",
        es: "/es",
        de: "/de",
        ko: "/ko",
        pt: "/pt",
        ar: "/ar"
      },
    },
  };
}

/**
 * 生成页面特定的SEO元数据
 */
export async function generatePageMetadata({
  locale,
  title,
  description,
  keywords,
  image,
  url,
}: {
  locale: string;
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
}): Promise<Metadata> {
  return generateSEOMetadata({
    locale,
    title,
    description,
    keywords,
    noIndex: false, // 确保页面可以被索引
    image,
    url,
  });
}
