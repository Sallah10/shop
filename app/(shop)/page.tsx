import type { Metadata } from "next";

import { ProductCard } from "@/components/products/ProductCard";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/env";
import { getErrorMessage } from "@/lib/format";
import { getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse the full Northbound catalog: cookware, tableware, linen bedding, lighting and small everyday objects.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  let products;
  try {
    products = await getProducts();
  } catch (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <ErrorNotice title="Could not load products" message={getErrorMessage(error)} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everyday things, made properly
        </h1>
        <p className="mt-3 text-zinc-600">
          A short list of things we actually use ourselves. Free shipping over $75.
        </p>
      </section>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          No products yet. Run <code className="font-mono">supabase/schema.sql</code> in the Supabase
          SQL editor to seed the catalog.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
