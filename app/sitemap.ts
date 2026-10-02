import type { MetadataRoute } from "next";

import { isSupabaseConfigured } from "@/lib/env";
import { getProducts } from "@/lib/products";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/cart`, changeFrequency: "monthly", priority: 0.3 },
  ];

  if (isSupabaseConfigured()) {
    try {
      const products = await getProducts();

      for (const product of products) {
        entries.push({
          url: `${baseUrl}/products/${product.id}`,
          lastModified: new Date(product.created_at),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    } catch (error) {
      console.error("Sitemap could not load products", error);
    }
  }

  return entries;
}
