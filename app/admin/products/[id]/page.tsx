import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { formatPrice, getErrorMessage } from "@/lib/format";
import { getProductById } from "@/lib/products";

export const metadata: Metadata = {
  title: "Edit product",
};

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;

  let product;
  try {
    product = await getProductById(id);
  } catch (error) {
    return (
      <ErrorNotice title="Could not load this product" message={getErrorMessage(error)} />
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/products"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        &larr; All products
      </Link>

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{product.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {formatPrice(product.price)} &middot; {product.stock} in stock
          </p>
        </div>

        <Link
          href={`/products/${product.id}`}
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          View on the shop
        </Link>
      </div>

      <ProductForm product={product} />

      <div className="mt-10 border-t border-zinc-200 pt-6">
        <h3 className="text-sm font-semibold tracking-tight uppercase">Danger zone</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Deleting cannot be undone, and a product that already sits in an order cannot be
          deleted at all. Set the stock to 0 to take something off the shop front instead.
        </p>

        <div className="mt-4">
          <DeleteProductButton id={product.id} name={product.name} />
        </div>
      </div>
    </div>
  );
}