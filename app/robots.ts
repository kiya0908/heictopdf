import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/app/",
          "/_next/",
          "/static/"
        ]
      }
    ],
    sitemap: "https://heic-to-pdf.pro/sitemap.xml",
    host: "https://heic-to-pdf.pro"
  };
}
