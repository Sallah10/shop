"use client";

import Link from "next/link";

import { useCart } from "@/components/cart/CartProvider";

export function CartButton() {
  const { itemCount, isReady } = useCart();

  return (
    <Link
      href="/cart"
      aria-label="Cart"
      className="relative inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:px-3"
    >
      <CartIcon />
      <span className="hidden sm:inline">Cart</span>
      {isReady && itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-zinc-900 px-1 text-[11px] leading-4 font-semibold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  );
}
