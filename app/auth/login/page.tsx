import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Log in",
};

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  missing_code: "Google did not send an authorization code back. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/auth/login">) {
  const { next, error } = await searchParams;
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const user = await getUser();

  if (user) {
    redirect(safeNext);
  }

  const errorCode = typeof error === "string" ? error : null;

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        You need an account to check out. We only use your email address for the order confirmation.
      </p>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <GoogleLoginButton next={safeNext} />

        {errorCode && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {errorMessages[errorCode] ?? "Something went wrong while logging in. Please try again."}
          </p>
        )}
      </div>

      <Link
        href="/"
        className="mt-6 text-center text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        Continue shopping as a guest
      </Link>
    </div>
  );
}
