import { SidebarNavItem, SiteConfig } from "types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_SITE_URL;

export const siteConfig: SiteConfig = {
  name: "HEIC to PDF Converter",
  description:
    "Convert your HEIC images to PDF format quickly and easily. High-quality conversion with privacy protection.",
  url: site_url,
  ogImage: `${site_url}/og.png`,
  links: {
    twitter: "https://x.com/yourname",
    github: "https://github.com/yourname",
  },
  mailSupport: "support@heictopdf.com",
};
