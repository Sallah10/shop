"use client";

import Link from "next/link";
import { useActionState } from "react";

import { placeOrder, type PlaceOrderState } from "@/app/actions/orders";
import { useCart } from "@/components/cart/CartProvider";
import { ProductImage } from "@/components/products/ProductImage";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatPrice } from "@/lib/format";

const initialState: PlaceOrderState = { error: null };

export function CheckoutForm({ email, defaultName }: { email: string; defaultName: string }) {
  const { lines, subtotal, isReady, setQuantity } = useCart();
  const [state, formAction, isPending] = useActionState(placeOrder, initialState);

  const payload = JSON.stringify(
    lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Checkout</h1>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">There is nothing to check out</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Add a product to your cart and come back here.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <form action={formAction} className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_22rem]">
          <input type="hidden" name="items" value={payload} />

          <div className="flex flex-col gap-8">
            <section className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold tracking-tight uppercase">Contact</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Signed in as <span className="font-medium text-zinc-700">{email}</span>
              </p>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-semibold tracking-tight uppercase">Shipping</h2>

              <div className="mt-4 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">Full name</span>
                  <input
                    type="text"
                    name="customerName"
                    defaultValue={defaultName}
                    autoComplete="name"
                    required
                    minLength={2}
                    placeholder="Ada Lovelace"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium">Shipping address</span>
                  <textarea
                    name="shippingAddress"
                    rows={3}
                    autoComplete="street-address"
                    required
                    minLength={10}
                    placeholder={"12 Example Street\nBerlin, 10115\nGermany"}
                    className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900"
                  />
                </label>
              </div>
            </section>

            {state.error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {state.error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={isPending || !isReady}
                className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {isPending ? "Placing order..." : "Place order"}
              </button>

              <Link
                href="/cart"
                className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
              >
                Back to cart
              </Link>
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold tracking-tight uppercase">Your order</h2>

            <ul className="mt-4 flex flex-col gap-4">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    <ProductImage src={line.imageUrl} alt={line.name} sizes="56px" />
                  </div>

                  <div className="flex flex-1 flex-col gap-1.5">
                    <p className="text-sm font-medium">{line.name}</p>
                    <div className="flex items-center justify-between gap-2">
                      <QuantityInput
                        label={`quantity of ${line.name}`}
                        value={line.quantity}
                        onChange={(quantity) => setQuantity(line.productId, quantity)}
                      />
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPrice(line.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-zinc-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Subtotal</dt>
                <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Shipping</dt>
                <dd className="font-medium">Free</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base">
                <dt className="font-semibold">Total</dt>
                <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs text-zinc-500">
              We recalculate every price from the database when you place the order.
            </p>
          </aside>
        </form>
      )}
    </div>
  );
}
