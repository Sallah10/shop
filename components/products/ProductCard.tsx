import Link from "next/link";

import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/supabase/database.types";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const isSoldOut = product.stock <= 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-zinc-100"
      >
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {isSoldOut && (
          <span className="absolute top-3 left-3 rounded-full bg-zinc-900/85 px-2.5 py-1 text-xs font-medium text-white">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm leading-snug font-medium">
            <Link href={`/products/${product.id}`} className="hover:underline">
              {product.name}
            </Link>
          </h3>
          <p className="shrink-0 text-sm font-semibold">{formatPrice(product.price)}</p>
        </div>

        <p className="line-clamp-2 text-sm text-zinc-500">{product.description}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <p className="text-xs text-zinc-500">
            {isSoldOut
              ? "Out of stock"
              : product.stock <= 5
                ? `Only ${product.stock} left`
                : "In stock"}
          </p>
          <AddToCartButton
            productId={product.id}
            name={product.name}
            price={product.price}
            imageUrl={product.image_url}
            disabled={isSoldOut}
          />
        </div>
      </div>
    </article>
  );
}
