import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminState } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user, isAdmin } = await getAdminState();

  if (!user) {
    redirect("/auth/login?next=%2Fadmin");
  }

  // Not a 403 on purpose: a signed in customer should not learn that an admin
  // area exists at all.
  if (!isAdmin) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <p className="text-xs tracking-wide text-zinc-500 uppercase">Admin</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight">
            {user.email ?? user.id}
          </h1>
        </div>

        <AdminNav />
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}