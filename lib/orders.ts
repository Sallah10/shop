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
