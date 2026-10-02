"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getProductsByIds } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export type PlaceOrderState = {
  error: string | null;
};

const MAX_QUANTITY = 99;

type PricedItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
};

function parseCartPayload(value: FormDataEntryValue | null): Map<string, number> {
  const quantities = new Map<string, number>();

  if (typeof value !== "string") {
    return quantities;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return quantities;
  }

  if (!Array.isArray(parsed)) {
    return quantities;
  }

  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }

    const line = entry as { productId?: unknown; quantity?: unknown };
    const productId = typeof line.productId === "string" ? line.productId : "";
    const quantity = Number(line.quantity);

    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      continue;
    }

    quantities.set(
      productId,
      Math.min((quantities.get(productId) ?? 0) + quantity, MAX_QUANTITY),
    );
  }

  return quantities;
}

export async function placeOrder(
  _previousState: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const shippingAddress = String(formData.get("shippingAddress") ?? "").trim();

  if (customerName.length < 2) {
    return { error: "Please enter the name for the order." };
  }

  if (shippingAddress.length < 10) {
    return { error: "Please enter a full shipping address, including city and postcode." };
  }

  const requested = parseCartPayload(formData.get("items"));

  if (requested.size === 0) {
    return { error: "Your cart is empty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/checkout");
  }

  const products = await getProductsByIds([...requested.keys()]);
  const productsById = new Map(products.map((product) => [product.id, product]));

  const items: PricedItem[] = [];

  for (const [productId, quantity] of requested) {
    const product = productsById.get(productId);

    if (!product) {
      return {
        error: "One of the products in your cart is no longer available. Please review your cart.",
      };
    }

    if (product.stock < quantity) {
      return {
        error:
          product.stock === 0
            ? `${product.name} just sold out. Please remove it from your cart.`
            : `Only ${product.stock} left of ${product.name}. Please lower the quantity in your cart.`,
      };
    }

    items.push({ product_id: product.id, quantity, unit_price: product.price });
  }

  const total = Number(
    items
      .reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
      .toFixed(2),
  );

  const customerEmail = user.email ?? "";

  if (!customerEmail) {
    return { error: "Your account does not have an email address, so we cannot confirm the order." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total,
      customer_name: customerName,
      customer_email: customerEmail,
      shipping_address: shippingAddress,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Failed to create order", orderError);
    return { error: "We could not save your order. Please try again in a moment." };
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    console.error("Failed to save order items", itemsError);
    return { error: "We could not save your order. Please try again in a moment." };
  }

  const { error: stockError } = await supabase.rpc("apply_stock_purchase", {
    p_order_id: order.id,
    p_items: items,
  });

  if (stockError) {
    console.error(`Failed to update stock for order ${order.id}`, stockError);
  }

  revalidatePath("/orders");
  redirect(`/order-success/${order.id}`);
}
