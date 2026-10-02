import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartPanel } from "@/components/cart/AddToCartPanel";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductImage } from "@/components/products/ProductImage";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPrice, getErrorMessage } from "@/lib/format";
import { getProductById, getRelatedProducts } from "@/lib/products";
import { getSiteUrl } from "@/lib/site";
import type { Product } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]">): Promise<Metadata> {
  if (!isSupabaseConfigured()) {
    return { title: "Product" };
  }

  try {
    const product = await getProductById((await params).id);

    if (!product) {
      return { title: "Product not found", robots: { index: false, follow: false } };
    }

    return {
      title: product.name,
      description: product.description.slice(0, 155),
      alternates: { canonical: `/products/${product.id}` },
      openGraph: {
        type: "website",
        title: `${product.name} | Northbound`,
        description: product.description.slice(0, 155),
        images: product.image_url ? [{ url: product.image_url, alt: product.name }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description: product.description.slice(0, 155),
        images: product.image_url ? [product.image_url] : undefined,
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const { id } = await params;

  let product;
  try {
    product = await getProductById(id);
  } catch (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <ErrorNotice title="Could not load this product" message={getErrorMessage(error)} />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  let related: Product[] = [];
  try {
    related = await getRelatedProducts(product.id);
  } catch {
    related = [];
  }

  const isSoldOut = product.stock <= 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        &larr; All products
      </Link>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: product.image_url ? [product.image_url] : undefined,
            sku: product.id,
            brand: { "@type": "Brand", name: "Northbound" },
            offers: {
              "@type": "Offer",
              price: product.price.toFixed(2),
              priceCurrency: "USD",
              availability: isSoldOut
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
              url: `${getSiteUrl()}/products/${product.id}`,
            },
          }),
        }}
      />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="lg:py-4">
          <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
          <p className="mt-3 text-2xl font-semibold">{formatPrice(product.price)}</p>

          <p
            className={`mt-4 text-sm font-medium ${isSoldOut ? "text-red-600" : "text-emerald-700"}`}
          >
            {isSoldOut
              ? "Out of stock"
              : product.stock <= 5
                ? `Only ${product.stock} left in stock`
                : "In stock, ships within two days"}
          </p>

          <p className="mt-6 leading-relaxed text-zinc-600">{product.description}</p>

          <AddToCartPanel product={product} />

          <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-zinc-200 pt-6 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Free shipping</dt>
              <dd className="mt-1 text-zinc-500">On every order over $75.</dd>
            </div>
            <div>
              <dt className="font-medium">Returns</dt>
              <dd className="mt-1 text-zinc-500">30 days, no questions asked.</dd>
            </div>
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-lg font-semibold tracking-tight">You might also like</h2>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
