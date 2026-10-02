"use client";

import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { useToast } from "@/components/ui/toast/ToastProvider";

type AddToCartButtonProps = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  disabled?: boolean;
};

export function AddToCartButton({
  productId,
  name,
  price,
  imageUrl,
  disabled = false,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) {
      return;
    }

    const timeout = setTimeout(() => setJustAdded(false), 2500);

    return () => clearTimeout(timeout);
  }, [justAdded]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        addItem({ productId, name, price, imageUrl });
        setJustAdded(true);
        toast({ title: "Added to cart", description: name, tone: "success" });
      }}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 ${
        justAdded
          ? "bg-emerald-600 text-white"
          : "bg-zinc-900 text-white hover:bg-zinc-700"
      }`}
    >
      {disabled ? "Sold out" : justAdded ? "Added" : "Add to cart"}
    </button>
  );
}
