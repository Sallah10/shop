import type { Metadata } from "next";
import Link from "next/link";

import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { formatPrice, getErrorMessage } from "@/lib/format";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Overview",
};

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 5;

export default async function AdminOverviewPage() {
  let products;
  try {
    products = await getProducts();
  } catch (error) {
    return <ErrorNotice title="Could not load the catalog" message={getErrorMessage(error)} />;
  }

  const unitsInStock = products.reduce((sum, product) => sum + product.stock, 0);
  const stockValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0,
  );
  const soldOut = products.filter((product) => product.stock === 0);
  const lowStock = products
    .filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock);

  const stats = [
    { label: "Products", value: String(products.length) },
    { label: "Units in stock", value: String(unitsInStock) },
    { label: "Stock value", value: formatPrice(stockValue) },
    { label: "Need restocking", value: String(soldOut.length + lowStock.length) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Catalog at a glance</h2>

          <Link
            href="/admin/products/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            New product
          </Link>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-5">
              <dt className="text-xs tracking-wide text-zinc-500 uppercase">{stat.label}</dt>
              <dd className="mt-1.5 text-2xl font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {lowStock.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Running low</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {LOW_STOCK_THRESHOLD} or fewer left in stock.
          </p>

          <ul className="mt-4 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {lowStock.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-zinc-50"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="shrink-0 text-zinc-500 tabular-nums">
                    {product.stock} left
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {soldOut.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Sold out</h2>

          <ul className="mt-4 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {soldOut.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-zinc-50"
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="shrink-0 text-red-600">Restock</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}