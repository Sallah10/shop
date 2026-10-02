"use client";

import { useActionState, useRef } from "react";

import { deleteProduct, type ProductFormState } from "@/app/admin/actions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const initialState: ProductFormState = { error: null };

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [state, formAction, isPending] = useActionState(deleteProduct, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="id" value={id} />
      </form>

      <ConfirmDialog
        title={`Delete "${name}"?`}
        description="This cannot be undone, and the product disappears from the shop front straight away. If it is already part of an order the database will refuse and you should set the stock to 0 instead."
        confirmLabel="Delete product"
        onConfirm={() => formRef.current?.requestSubmit()}
        trigger={
          <button
            type="button"
            disabled={isPending}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Deleting..." : "Delete product"}
          </button>
        }
      />

      {state.error && (
        <p role="alert" className="mt-3 max-w-md text-sm text-red-700">
          {state.error}
        </p>
      )}
    </div>
  );
}