"use client";

import { useEffect } from "react";

import { ErrorNotice } from "@/components/ui/ErrorNotice";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <ErrorNotice
        title="This page could not be loaded"
        message={error.message || "An unexpected error occurred."}
        action={
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            Try again
          </button>
        }
      />
    </div>
  );
}
