import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OrderWithItems } from "@/lib/supabase/database.types";

const ORDER_WITH_ITEMS =
  "*, items:order_items(*, product:products(id, name, image_url))";

export async function getOrderWithItems(id: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS)
    .eq("id", id)
    .maybeSingle()
    .returns<OrderWithItems | null>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getOrdersForUser(userId: string): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<OrderWithItems[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Every order in the shop, newest first. Only reachable through the
 * "admins can read all orders" policy, so this never returns rows for a
 * customer.
 */
export async function getAllOrders(limit = 100): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<OrderWithItems[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export type DailyRevenue = {
  day: string;
  orders: number;
  revenue: number;
};

/**
 * Reads the security_invoker view, which aggregates in Postgres. Returns one
 * row per day that actually has orders, oldest first.
 */
export async function getDailyRevenue(): Promise<DailyRevenue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_revenue")
    .select("day, orders, revenue")
    .order("day", { ascending: true })
    .returns<DailyRevenue[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
