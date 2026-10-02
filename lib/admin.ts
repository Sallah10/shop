import "server-only";

import { redirect } from "next/navigation";

import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AdminState = {
  user: User | null;
  isAdmin: boolean;
};

export async function getAdminState(): Promise<AdminState> {
  if (!isSupabaseConfigured()) {
    return { user: null, isAdmin: false };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  // The select policy on public.admins only returns the caller's own row, so
  // a non admin gets null here without being able to read anyone else's.
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return { user, isAdmin: data !== null };
}

export async function isAdmin(): Promise<boolean> {
  try {
    return (await getAdminState()).isAdmin;
  } catch {
    return false;
  }
}

/**
 * Guard for admin server actions. Layouts do not protect actions, so every
 * action has to call this itself.
 *
 * This is a convenience, not the security boundary: the real check is the RLS
 * policy on public.products, which rejects the write either way. Redirecting
 * on the way out just gives the caller a page instead of a database error.
 */
export async function requireAdmin(): Promise<User> {
  const { user, isAdmin } = await getAdminState();

  if (!user) {
    redirect("/auth/login?next=%2Fadmin");
  }

  if (!isAdmin) {
    redirect("/");
  }

  return user;
}