import Link from "next/link";

import { isSupabaseConfigured } from "@/lib/env";
import { getUser } from "@/lib/supabase/server";

import { CartButton } from "./CartButton";
import { UserMenu } from "./UserMenu";

export async function Navbar() {
  const user = isSupabaseConfigured() ? await getUser() : null;

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

          {user ? (
            <UserMenu email={user.email ?? "Signed in"} />
          ) : (
            <Link
              href="/auth/login"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
