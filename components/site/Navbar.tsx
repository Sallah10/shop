import Link from "next/link";

import { CartButton } from "./CartButton";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
            N
          </span>
          <span className="text-base font-semibold tracking-tight">Northbound</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Shop
          </Link>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
