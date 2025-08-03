export const BLOG_CATEGORIES: {
  title: string;
  slug: "news" | "education" | "tutorial" | "guide";
  description: string;
}[] = [
  {
    title: "News",
    slug: "news",
    description: "Updates and announcements from Next SaaS Starter.",
  },
  {
    title: "Education",
    slug: "education",
    description: "Educational content about SaaS management.",
  },
  {
    title: "Tutorial",
    slug: "tutorial",
    description: "Step-by-step tutorials and how-to guides.",
  },
  {
    title: "Guide",
    slug: "guide",
    description: "Comprehensive guides and best practices.",
  },
];

export const BLOG_AUTHORS = {
  koyaguo: {
    name: "koyaguo",
    image: "https://meme-static.douni.one/avatar.png",
    twitter: "koyaguo",
  }
};