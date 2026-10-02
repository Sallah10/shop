import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClearCartOnSuccess } from "@/components/cart/ClearCartOnSuccess";
import { ProductImage } from "@/components/products/ProductImage";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDate, formatPrice, getErrorMessage } from "@/lib/format";
import { getOrderWithItems } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Order confirmed",
};

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ params }: PageProps<"/order-success/[id]">) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const { id } = await params;

  let order;
  try {
    order = await getOrderWithItems(id);
  } catch (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <ErrorNotice title="Could not load this order" message={getErrorMessage(error)} />
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <ClearCartOnSuccess />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm font-medium text-emerald-800">Order placed</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Thanks, {order.customer_name}. Your order is confirmed.
        </h1>
        <p className="mt-2 text-sm text-emerald-800">
          A confirmation email is on its way to {order.customer_email}.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div>
            <p className="text-xs tracking-wide text-zinc-500 uppercase">Order</p>
            <p className="font-mono text-sm">{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-wide text-zinc-500 uppercase">Placed</p>
            <p className="text-sm">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <ul className="divide-y divide-zinc-200">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                <ProductImage
                  src={item.product?.image_url ?? null}
                  alt={item.product?.name ?? "Product"}
                  sizes="56px"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {item.product?.name ?? "Removed product"}
                </p>
                <p className="text-sm text-zinc-500">
                  {item.quantity} x {formatPrice(item.unit_price)}
                </p>
              </div>

              <p className="text-sm font-semibold tabular-nums">
                {formatPrice(item.unit_price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <div className="border-t border-zinc-200 px-5 py-4">
          <div className="flex justify-between text-base">
            <span className="font-semibold">Total</span>
            <span className="font-semibold tabular-nums">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white px-5 py-4">
        <p className="text-xs tracking-wide text-zinc-500 uppercase">Shipping to</p>
        <p className="mt-2 text-sm whitespace-pre-line">{order.shipping_address}</p>
        <p className="mt-3 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 capitalize">
          {order.status}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/orders"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          View all orders
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
