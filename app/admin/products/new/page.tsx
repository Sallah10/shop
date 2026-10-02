import type { Metadata } from "next";
import Link from "next/link";

import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "New product",
};

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/products"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        &larr; All products
      </Link>

      <h2 className="mt-4 mb-6 text-lg font-semibold tracking-tight">New product</h2>

      <ProductForm />
    </div>
  );
}