import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/env";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Checkout",
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const user = await getUser();

  if (!user) {
    redirect("/auth/login?next=/checkout");
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";

  return <CheckoutForm email={user.email ?? ""} defaultName={fullName} />;
}
