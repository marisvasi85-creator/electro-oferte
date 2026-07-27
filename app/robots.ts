import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/termeni", "/confidentialitate"],
      disallow: ["/recovery"],
    },
    sitemap: "https://electro-oferte.vercel.app/sitemap.xml",
  };
}
