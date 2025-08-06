import { redirect } from "next/navigation";

import { unstable_setRequestLocale } from "next-intl/server";

// TODO: newsletters 功能已被废弃，相关数据表已删除
// 这个页面暂时重定向到首页，后续可以完全删除

export const metadata = {
  title: "Newsletter",
};

export default async function NewsletterPage({
  params,
}: {
  params: { id: string; locale: string };
}) {
  unstable_setRequestLocale(params.locale);
  
  // newsletters 表已被删除，直接重定向到首页
  redirect("/");
}

/*
// 原实现 - 保留以备参考
import { type Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Container } from "@/components/layout/container";
import { prisma } from "@/db/prisma";

async function getNewsletter(id: string) {
  const newsletter = await prisma.newsletters.findFirst({
    where: {
      id: parseInt(id),
    },
  });

  if (!newsletter || !newsletter.body) {
    notFound();
  }

  return newsletter;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string; locale: string };
}) {
  const newsletter = await getNewsletter(params.id);
  unstable_setRequestLocale(params.locale);

  const imageUrlRegex = /!\[[^\]]*\]\((.*?)\)/;
  const match = newsletter.body?.match(imageUrlRegex);
  let imageUrl: string | undefined = undefined;

  if (match) {
    imageUrl = match[1];
  }

  return {
    title: newsletter.subject,
    description: newsletter.subject,
    openGraph: {
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      title: newsletter.subject ?? "",
      description: newsletter.subject ?? "",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: newsletter.subject ?? "",
      description: newsletter.subject ?? "",
      images: imageUrl ? [{ url: imageUrl }] : undefined,
      site: "@koyaguo",
      creator: "@koyaguo",
    },
  } satisfies Metadata;
}

export default async function NewsletterRenderPage({
  params,
}: {
  params: { id: string };
}) {
  const newsletter = await getNewsletter(params.id);

  if (!newsletter.body) {
    return null;
  }

  return (
    <Container className="mt-16">
      <article className="prose mx-auto max-w-[500px] dark:prose-invert">
        <ReactMarkdown>{newsletter.body}</ReactMarkdown>
      </article>
    </Container>
  );
}

export const revalidate = 3600;
*/