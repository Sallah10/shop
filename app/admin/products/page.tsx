import type { Metadata } from "next";
import Link from "next/link";

import { ProductImage } from "@/components/products/ProductImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { formatDate, formatPrice, getErrorMessage } from "@/lib/format";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Products",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let products;
  try {
    products = await getProducts();
  } catch (error) {
    return <ErrorNotice title="Could not load products" message={getErrorMessage(error)} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Products
          <span className="ml-2 text-sm font-normal text-zinc-500">{products.length}</span>
        </h2>

        <Link
          href="/admin/products/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No products yet"
            description="Add your first product and it appears on the shop front straight away."
            action={
              <Link
                href="/admin/products/new"
                className="mt-1 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                New product
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs tracking-wide text-zinc-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Product
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Price
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Stock
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Added
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200">
              {products.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-zinc-50">
                  <th scope="row" className="px-5 py-3 font-normal">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                        <ProductImage src={product.image_url} alt={product.name} sizes="44px" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium">{product.name}</p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </th>

                  <td className="px-5 py-3 tabular-nums">{formatPrice(product.price)}</td>

                  <td className="px-5 py-3 tabular-nums">
                    {product.stock === 0 ? (
                      <span className="text-red-600">Sold out</span>
                    ) : (
                      product.stock
                    )}
                  </td>

                  <td className="px-5 py-3 text-zinc-500">{formatDate(product.created_at)}</td>

                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/products/${product.id}`}
                        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}