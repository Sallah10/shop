"use client";

import { useActionState } from "react";

import { saveProduct, type ProductFormState } from "@/app/admin/actions";
import { ProductImage } from "@/components/products/ProductImage";
import type { Product } from "@/lib/supabase/database.types";

const initialState: ProductFormState = { error: null };

const fieldClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-zinc-900";

export function ProductForm({ product }: { product?: Product }) {
  const [state, formAction, isPending] = useActionState(saveProduct, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold tracking-tight uppercase">Basics</h2>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Name</span>
            <input
              type="text"
              name="name"
              defaultValue={product?.name}
              required
              minLength={2}
              maxLength={120}
              placeholder="Cast Iron Skillet 26 cm"
              className={fieldClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Description</span>
            <textarea
              name="description"
              rows={5}
              defaultValue={product?.description}
              required
              minLength={10}
              placeholder={"Pre seasoned pan with a helper handle. Works on induction, gas and electric."}
              className={`${fieldClassName} resize-y leading-relaxed`}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Price (USD)</span>
              <input
                type="number"
                name="price"
                defaultValue={product?.price ?? ""}
                required
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="72.00"
                className={`${fieldClassName} tabular-nums`}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Stock</span>
              <input
                type="number"
                name="stock"
                defaultValue={product?.stock ?? 0}
                required
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="16"
                className={`${fieldClassName} tabular-nums`}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold tracking-tight uppercase">Photo</h2>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative size-28 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            <ProductImage
              src={product?.image_url ?? null}
              alt={product?.name ?? "No photo yet"}
              sizes="112px"
            />
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Upload a photo</span>
              <input
                type="file"
                name="image"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-700"
              />
              <span className="text-xs text-zinc-500">
                JPEG, PNG, WebP or AVIF, up to 4 MB. Square images look best.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Or paste an image link</span>
              <input
                type="url"
                name="imageUrl"
                defaultValue={product?.image_url ?? ""}
                placeholder="https://example.com/skillet.jpg"
                className={fieldClassName}
              />
              <span className="text-xs text-zinc-500">
                Ignored when you upload a file in the same save.
              </span>
            </label>

            {product?.image_url && (
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  name="removeImage"
                  className="size-4 rounded border-zinc-300"
                />
                Remove the current photo
              </label>
            )}
          </div>
        </div>
      </div>

      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isPending ? "Saving..." : product ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}