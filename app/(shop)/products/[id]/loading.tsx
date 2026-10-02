export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square animate-pulse rounded-2xl bg-zinc-200" />

        <div className="flex flex-col gap-4 lg:py-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="h-7 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
          <div className="mt-2 flex flex-col gap-2">
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="mt-4 h-11 w-40 animate-pulse rounded-lg bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
