"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  isReady: boolean;
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "shop.cart.v1";
const CART_EVENT = "shop:cart-change";
const MAX_QUANTITY = 99;
const EMPTY_CART: CartLine[] = [];

const CartContext = createContext<CartContextValue | null>(null);

function parseStoredCart(value: string | null): CartLine[] {
  if (!value) {
    return EMPTY_CART;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return EMPTY_CART;
    }

    const lines = parsed.flatMap((entry): CartLine[] => {
      if (typeof entry !== "object" || entry === null) {
        return [];
      }

      const line = entry as Partial<CartLine>;
      const productId = typeof line.productId === "string" ? line.productId : "";
      const name = typeof line.name === "string" ? line.name : "";
      const price = Number(line.price);
      const quantity = Number(line.quantity);

      if (!productId || !name || !Number.isFinite(price) || !Number.isFinite(quantity)) {
        return [];
      }

      return [
        {
          productId,
          name,
          price,
          imageUrl: typeof line.imageUrl === "string" ? line.imageUrl : null,
          quantity: Math.min(Math.max(Math.trunc(quantity), 1), MAX_QUANTITY),
        },
      ];
    });

    return lines.length > 0 ? lines : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

let cachedRaw: string | null | undefined;
let cachedLines: CartLine[] = EMPTY_CART;

function getSnapshot(): CartLine[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parseStoredCart(raw);
  }

  return cachedLines;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY_CART;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CART_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(CART_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function writeCart(lines: CartLine[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(CART_EVENT));
}

function subscribeToHydration() {
  return () => {};
}

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isReady = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const addItem = useCallback((item: Omit<CartLine, "quantity">, quantity = 1) => {
    const current = getSnapshot();
    const existing = current.find((line) => line.productId === item.productId);

    if (!existing) {
      writeCart([...current, { ...item, quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY) }]);
      return;
    }

    writeCart(
      current.map((line) =>
        line.productId === item.productId
          ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_QUANTITY) }
          : line,
      ),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    writeCart(getSnapshot().filter((line) => line.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const current = getSnapshot();

    writeCart(
      quantity <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) =>
            line.productId === productId
              ? {
                  ...line,
                  quantity: Math.min(Math.max(Math.trunc(quantity), 1), MAX_QUANTITY),
                }
              : line,
          ),
    );
  }, []);

  const clearCart = useCallback(() => writeCart(EMPTY_CART), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
    const subtotal = lines.reduce((total, line) => total + line.price * line.quantity, 0);

    return { lines, itemCount, subtotal, isReady, addItem, removeItem, setQuantity, clearCart };
  }, [lines, isReady, addItem, removeItem, setQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider.");
  }

  return context;
}
