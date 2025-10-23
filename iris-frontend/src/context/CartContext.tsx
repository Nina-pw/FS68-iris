// src/context/CartContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext"; // ✅ ใช้ดูสถานะผู้ใช้
import type { Cart, CartItem } from "../types";

/** Response shape จาก /api/cart/me */
export type CartSummary = { total_qty: number; subtotal: number };
export type CartMeResponse = Cart & {
  items: (CartItem & {
    sku?: string;
    shade_name?: string | null;
    shade_code?: string | null;
    image_url?: string | null;
    price_now?: number | string | null;
    stock_qty?: number | null;
  })[];
  summary: CartSummary;
};

type CartContextType = {
  cart: CartMeResponse | null;
  isOpen: boolean;
  loading: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  refresh: () => Promise<void>;
  add: (variantId: number, qty?: number) => Promise<void>;
  setQty: (itemId: number, qty: number) => Promise<void>;
  remove: (itemId: number) => Promise<void>;
  clearLocal: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartMeResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth(); // ✅ รู้ว่าใครล็อกอินอยู่

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.getCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const add = async (variantId: number, qty = 1) => {
    setLoading(true);
    try {
      const data = await api.addToCart(variantId, qty);
      setCart(data);
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const setQty = async (itemId: number, qty: number) => {
    setLoading(true);
    try {
      const data = await api.updateCartItemQty(itemId, qty);
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (itemId: number) => {
    setLoading(true);
    try {
      const data = await api.deleteCartItem(itemId);
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const clearLocal = () => {
    setCart(null);
    setIsOpen(false);
  };

  // ✅ โหลดตะกร้าเฉพาะตอนมีผู้ใช้ (กัน 401) และล้างตะกร้าเมื่อ logout
  useEffect(() => {
    if (currentUser) {
      refresh().catch(() => {}); // เงียบ ๆ ถ้ามี error
    } else {
      clearLocal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]); // เปลี่ยน user → รีเฟรช/เคลียร์ ตามสถานะ

  const value = useMemo(
    () => ({
      cart,
      isOpen,
      loading,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
      refresh,
      add,
      setQty,
      remove,
      clearLocal,
    }),
    [cart, isOpen, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
};
