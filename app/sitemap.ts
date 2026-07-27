import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://electro-oferte.vercel.app";
  const lastModified = new Date("2026-07-27");
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/termeni`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/confidentialitate`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
