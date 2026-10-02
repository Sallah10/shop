import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/supabase/database.types";

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getRelatedProducts(id: string, limit = 4): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .neq("id", id)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
