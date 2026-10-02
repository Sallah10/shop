import Link from "next/link";

import { logOut } from "@/app/auth/actions";

export function UserMenu({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-2">
      <Link
        href="/orders"
        className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:px-3"
      >
        Orders
      </Link>

      <span
        title={email}
        className="hidden max-w-40 truncate px-1 text-sm text-zinc-500 lg:inline"
      >
        {email}
      </span>

      <form action={logOut}>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:px-3"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
