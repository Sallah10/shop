import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDate, formatPrice, getErrorMessage } from "@/lib/format";
import { getOrdersForUser } from "@/lib/orders";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const user = await getUser();

  if (!user) {
    redirect("/auth/login?next=/orders");
  }

  let orders;
  try {
    orders = await getOrdersForUser(user.id);
  } catch (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <ErrorNotice title="Could not load your orders" message={getErrorMessage(error)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No orders yet"
            description="When you place an order it will show up here with its status and total."
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
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <li key={order.id}>
                <Link
                  href={`/order-success/${order.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm">{order.id}</span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 capitalize">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-sm text-zinc-500">
                      {order.items
                        .map((item) => item.product?.name ?? "Removed product")
                        .join(", ")}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-6 text-sm sm:flex-col sm:items-end sm:gap-1">
                    <span className="font-semibold tabular-nums">{formatPrice(order.total)}</span>
                    <span className="text-zinc-500">
                      {formatDate(order.created_at)} &middot; {itemCount}{" "}
                      {itemCount === 1 ? "item" : "items"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
