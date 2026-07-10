import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://songsouls.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/product", "/ai", "/compliance", "/pricing", "/resources"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}
