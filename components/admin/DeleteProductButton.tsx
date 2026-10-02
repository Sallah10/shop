"use client";

import { useActionState } from "react";

import { deleteProduct, type ProductFormState } from "@/app/admin/actions";

const initialState: ProductFormState = { error: null };

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [state, formAction, isPending] = useActionState(deleteProduct, initialState);

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!confirm(`Delete "${name}"? Customers will no longer see it.`)) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Deleting..." : "Delete product"}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="mt-3 max-w-md text-sm text-red-700">
          {state.error}
        </p>
      )}
    </div>
  );
}