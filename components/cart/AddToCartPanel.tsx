"use client";

import { useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/supabase/database.types";

export function AddToCartPanel({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCart();

  const isSoldOut = product.stock <= 0;
  const maxQuantity = Math.max(Math.min(product.stock, 99), 1);

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <QuantityInput
          label={`quantity of ${product.name}`}
          value={quantity}
          max={maxQuantity}
          onChange={(next) => {
            setQuantity(next);
            setIsAdded(false);
          }}
        />
        <p className="text-sm text-zinc-500">
          {isSoldOut ? null : (
            <>
              {formatPrice(product.price * quantity)} total
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        disabled={isSoldOut}
        onClick={() => {
          addItem(
            {
              productId: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.image_url,
            },
            quantity,
          );
          setIsAdded(true);
        }}
        className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 sm:w-auto"
      >
        {isSoldOut ? "Sold out" : isAdded ? "Added to cart" : "Add to cart"}
      </button>
    </div>
  );
}
