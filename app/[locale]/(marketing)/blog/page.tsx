import { allPosts } from "contentlayer/generated";
import { getTranslations, unstable_setRequestLocale } from "next-intl/server";

import { generatePageMetadata } from "@/lib/seo";
import { BlogPosts } from "@/components/content/blog-posts";
import { getBlurDataURL } from "@/lib/utils";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params: { locale } }: PageProps) {
  const t = await getTranslations({ locale });
  
  return generatePageMetadata({
    locale,
    title: `${t("BlogPage.title")} - ${t("LocaleLayout.title")}`,
    description: `Read our latest articles about HEIC to PDF conversion, image processing tips, and technology insights. ${t("BlogPage.description")}`,
    keywords: ["HEIC to PDF blog", "image conversion tips", "technology articles", "PDF conversion guide"],
  });
}

export default async function BlogPage({ params: { locale } }: PageProps) {
  unstable_setRequestLocale(locale);
  
  const t = await getTranslations({ locale });
  
  const posts = await Promise.all(
    allPosts
      .filter((post) => post.published && post.language === locale)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(async (post) => ({
        ...post,
        blurDataURL: await getBlurDataURL(post.image),
      })),
  );

  return (
    <div className="container mx-auto py-8">
      {/* 添加H1标题 */}
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-gradient_indigo-purple mb-4">
          {t("BlogPage.title")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {t("BlogPage.description") || "Latest insights and tips about HEIC to PDF conversion"}
        </p>
      </div>
      
      <BlogPosts posts={posts} />
    </div>
  );
}
