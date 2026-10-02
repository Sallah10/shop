"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { SupabaseClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/lib/admin";
import { isOrderStatus, type OrderStatus } from "@/lib/order-status";
import { getProductById } from "@/lib/products";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ProductFormState = {
  error: string | null;
};

export type OrderStatusState = {
  error: string | null;
  status: OrderStatus | null;
};

const BUCKET = "product-images";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

type ParsedProduct = {
  name: string;
  description: string;
  price: number;
  stock: number;
  removeImage: boolean;
  imageUrl: string;
};

function parseProduct(formData: FormData): ParsedProduct | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawPrice = String(formData.get("price") ?? "").trim();
  const rawStock = String(formData.get("stock") ?? "").trim();

  if (name.length < 2) {
    return { error: "Give the product a name of at least 2 characters." };
  }

  if (description.length < 10) {
    return { error: "Write a description of at least 10 characters." };
  }

  const price = Number(rawPrice);

  if (rawPrice === "" || !Number.isFinite(price) || price < 0) {
    return { error: "Price must be zero or more." };
  }

  const stock = Number(rawStock);

  if (rawStock === "" || !Number.isInteger(stock) || stock < 0) {
    return { error: "Stock must be a whole number, zero or more." };
  }

  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    return { error: "Image link has to start with http:// or https://" };
  }

  return {
    name,
    description,
    price: Number(price.toFixed(2)),
    stock,
    removeImage: formData.get("removeImage") === "on",
    imageUrl,
  };
}

function readImage(formData: FormData): File | null | { error: string } {
  const value = formData.get("image");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const extension = IMAGE_EXTENSIONS[value.type];

  if (!extension) {
    return { error: "Image has to be a JPEG, PNG, WebP or AVIF file." };
  }

  if (value.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be smaller than 4 MB." };
  }

  return value;
}

function isUploadError(value: File | null | { error: string }): value is { error: string } {
  return !value && typeof value === "object";
}

async function uploadImage(supabase: SupabaseClient<Database>, file: File): Promise<string> {
  const extension = IMAGE_EXTENSIONS[file.type];
  const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function removeStoredImage(supabase: SupabaseClient<Database>, url: string | null) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;

  if (!url?.includes(marker)) {
    return;
  }

  await supabase.storage.from(BUCKET).remove([url.split(marker)[1]]);
}

function revalidateProduct(id?: string) {
  revalidatePath("/");
  revalidatePath("/admin/products");

  if (id) {
    revalidatePath(`/products/${id}`);
    revalidatePath(`/admin/products/${id}`);
  }
}

export async function saveProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const parsed = parseProduct(formData);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const upload = readImage(formData);

  if (isUploadError(upload)) {
    return { error: upload.error };
  }

  const supabase = await createClient();

  // Read the current row instead of trusting an image url posted back by the
  // form, so a stale or hand edited field cannot change what is stored.
  const existing = id ? await getProductById(id) : null;

  let imageUrl: string | null = existing?.image_url ?? null;

  if (parsed.removeImage) {
    imageUrl = null;
  } else if (upload) {
    try {
      imageUrl = await uploadImage(supabase, upload);
    } catch (error) {
      console.error("Failed to upload product image", error);
      return { error: "The image could not be uploaded. Please try again." };
    }
  } else if (parsed.imageUrl) {
    imageUrl = parsed.imageUrl;
  }

  const values = {
    name: parsed.name,
    description: parsed.description,
    price: parsed.price,
    stock: parsed.stock,
    image_url: imageUrl,
  };

  const result = existing
    ? await supabase.from("products").update(values).eq("id", existing.id)
    : await supabase.from("products").insert(values);

  if (result.error) {
    console.error("Failed to save product", result.error);
    return { error: "The product could not be saved. Please try again." };
  }

  if (existing && existing.image_url && existing.image_url !== imageUrl) {
    await removeStoredImage(supabase, existing.image_url);
  }

  revalidateProduct(existing?.id);
  redirect(existing ? "/admin/products?saved=1" : "/admin/products?created=1");
}

export async function deleteProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    return { error: "This product could not be found." };
  }

  const supabase = await createClient();
  const existing = await getProductById(id);

  if (!existing) {
    return { error: "This product has already been deleted." };
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error(`Failed to delete product ${id}`, error);

    // order_items.product_id is ON DELETE RESTRICT, so a product that is part
    // of an order is protected by the database rather than by this file.
    if (error.code === "23503") {
      return {
        error:
          "This product is part of an existing order, so it cannot be deleted. Set the stock to 0 to take it off the shop front instead.",
      };
    }

    return { error: "The product could not be deleted. Please try again." };
  }

  await removeStoredImage(supabase, existing.image_url);

  revalidateProduct(id);
  redirect("/admin/products?deleted=1");
}

export async function updateOrderStatus(
  _previousState: OrderStatusState,
  formData: FormData,
): Promise<OrderStatusState> {
  await requireAdmin();

  const id = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id) {
    return { error: "That order could not be found.", status: null };
  }

  if (!isOrderStatus(status)) {
    return { error: "That is not a status this shop uses.", status: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);

  if (error) {
    console.error(`Failed to update status for order ${id}`, error);

    return {
      error: "The status could not be saved. Reload the page and try again.",
      status: null,
    };
  }

  revalidatePath("/admin/orders");

  return { error: null, status };
}