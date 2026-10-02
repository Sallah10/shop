import Link from "next/link";

import { isAdmin } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/env";
import { getUser } from "@/lib/supabase/server";

import { CartButton } from "./CartButton";
import { UserMenu } from "./UserMenu";

export async function Navbar() {
  const user = isSupabaseConfigured() ? await getUser() : null;
  const admin = user ? await isAdmin() : false;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white">
            N
          </span>
          <span className="hidden truncate text-base font-semibold tracking-tight sm:inline">
            Northbound
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link
            href="/"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:block"
          >
            Shop
          </Link>

          <CartButton />

          {admin && (
            <Link
              href="/admin"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:block"
            >
              Admin
            </Link>
          )}

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
