import { ImageResponse } from "next/og";

import { isSupabaseConfigured } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/supabase/database.types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Northbound, a small shop for well made everyday things";

async function getFeaturedProduct(): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const products = await getProducts();

    return products[Math.floor(Math.random() * products.length)] ?? null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const featured = await getFeaturedProduct();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#09090b",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "#fafafa",
              color: "#09090b",
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            N
          </div>
          <div style={{ display: "flex", fontSize: "36px", fontWeight: 600, color: "#fafafa" }}>
            Northbound
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "#fafafa",
              maxWidth: "900px",
            }}
          >
            Everyday things, made properly.
          </div>
          <div style={{ display: "flex", fontSize: "30px", color: "#a1a1aa" }}>
            Free shipping over $75. 30 day returns.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #27272a",
            paddingTop: "32px",
            fontSize: "26px",
            color: "#a1a1aa",
          }}
        >
          <div style={{ display: "flex" }}>northbound.shop</div>
          <div style={{ display: "flex", color: "#fafafa" }}>
            {featured ? `${featured.name} — ${formatPrice(featured.price)}` : "New arrivals weekly"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
