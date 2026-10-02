import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold text-zinc-400">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">We could not find that page</h1>
      <p className="text-sm text-zinc-500">
        The product or order you were looking for does not exist, or it is no longer available.
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
        >
          Back to the shop
        </Link>
        <Link
          href="/orders"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
        >
          Your orders
        </Link>
      </div>
    </div>
  );
}
