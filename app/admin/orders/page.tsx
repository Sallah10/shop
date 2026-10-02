import type { Metadata } from "next";

import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { formatDate, formatPrice, getErrorMessage } from "@/lib/format";
import { getAllOrders } from "@/lib/orders";
import { ProductImage } from "@/components/products/ProductImage";

export const metadata: Metadata = {
  title: "Orders",
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  let orders;
  try {
    orders = await getAllOrders();
  } catch (error) {
    return <ErrorNotice title="Could not load orders" message={getErrorMessage(error)} />;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">
        Orders
        <span className="ml-2 text-sm font-normal text-zinc-500">{orders.length}</span>
      </h2>

      {orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No orders yet"
            description="Orders appear here as soon as a customer checks out. Place one yourself from the shop front to see the flow end to end."
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">
                    {order.customer_email}
                  </p>
                  <p className="mt-1.5 font-mono text-xs text-zinc-400">{order.id}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-base font-semibold tabular-nums">
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(order.created_at)}</p>
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </div>
              </div>

              <div className="px-5 py-4">
                <ul className="flex flex-col gap-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                        <ProductImage
                          src={item.product?.image_url ?? null}
                          alt={item.product?.name ?? "Product"}
                          sizes="40px"
                        />
                      </div>

                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium">
                          {item.product?.name ?? "Removed product"}
                        </p>
                        <p className="text-zinc-500">
                          {item.quantity} x {formatPrice(item.unit_price)}
                        </p>
                      </div>

                      <p className="text-sm font-semibold tabular-nums">
                        {formatPrice(item.unit_price * item.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 border-t border-zinc-200 pt-3 text-sm whitespace-pre-line text-zinc-500">
                  {order.shipping_address}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}