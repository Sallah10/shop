"use client";

import Link from "next/link";

import { useCart, type CartLine } from "@/components/cart/CartProvider";
import { ProductImage } from "@/components/products/ProductImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatPrice } from "@/lib/format";

export function CartView() {
  const { lines, subtotal, isReady, removeItem, setQuantity } = useCart();

  if (!isReady) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200" />
        <div className="mt-8 space-y-4">
          <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
          <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          description="Once you add something it will show up here, together with the running total."
          action={
            <Link
              href="/"
              className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your cart</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-zinc-200 border-y border-zinc-200">
          {lines.map((line) => (
            <CartLineRow
              key={line.productId}
              line={line}
              onRemove={() => removeItem(line.productId)}
              onQuantityChange={(quantity) => setQuantity(line.productId, quantity)}
            />
          ))}
        </ul>

        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="text-sm font-semibold tracking-tight uppercase">Order summary</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Shipping</dt>
              <dd className="font-medium">Free</dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            Prices are confirmed again on the server when you place the order.
          </p>

          <Link
            href="/checkout"
            className="mt-6 block rounded-lg bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            Proceed to checkout
          </Link>

          <Link
            href="/"
            className="mt-3 block text-center text-sm text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

function CartLineRow({
  line,
  onRemove,
  onQuantityChange,
}: {
  line: CartLine;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/products/${line.productId}`}
        className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 sm:size-24"
      >
        <ProductImage src={line.imageUrl} alt={line.name} sizes="96px" />
      </Link>

      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/products/${line.productId}`}
            className="text-sm font-medium hover:underline"
          >
            {line.name}
          </Link>
          <p className="mt-1 text-sm text-zinc-500">{formatPrice(line.price)} each</p>
        </div>

        <div className="flex items-center gap-4">
          <QuantityInput
            label={`quantity of ${line.name}`}
            value={line.quantity}
            onChange={onQuantityChange}
          />

          <p className="w-20 text-right text-sm font-semibold tabular-nums">
            {formatPrice(line.price * line.quantity)}
          </p>

          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${line.name} from cart`}
            className="text-sm text-zinc-400 transition-colors hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
