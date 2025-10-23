// // src/services/cart.ts
// import axios from "./api"; // ✅ ใช้ instance ที่ตั้ง baseURL/withCredentials/interceptors แล้ว
// import type { Cart, CartItem } from "../types";

// export type CartSummary = { total_qty: number; subtotal: number };

// export type CartMeResponse = Cart & {
//   items: (CartItem & {
//     sku?: string;
//     shade_name?: string;
//     shade_code?: string;
//     image_url?: string | null;
//     price_now?: number;
//     stock_qty?: number;
//   })[];
//   summary: CartSummary;
// };

// export async function getCartMe() {
//   const token = localStorage.getItem("accessToken");
//   if (!token) throw new Error("Missing token");

//   const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/me`, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`, // 👈 ส่ง token มาด้วย
//     },
//     credentials: "include", // เผื่อใช้ cookie auth ในบางกรณี
//   });

//   if (!res.ok) {
//     const msg = await res.text();
//     throw new Error(`Failed to fetch cart: ${res.status} ${msg}`);
//   }

//   return await res.json();
// }


// export async function addToCart(
//   variant_id: number,
//   qty = 1
// ): Promise<CartMeResponse> {
//   const { data } = await axios.post<CartMeResponse>("/api/cart/items", { variant_id, qty });
//   return data;
// }

// export async function setCartItemQty(
//   itemId: number,
//   qty: number
// ): Promise<CartMeResponse> {
//   const { data } = await axios.patch<CartMeResponse>(`/api/cart/items/${itemId}`, { qty });
//   return data;
// }

// export async function removeCartItem(itemId: number): Promise<CartMeResponse> {
//   const { data } = await axios.delete<CartMeResponse>(`/api/cart/items/${itemId}`);
//   return data;
// }

// src/services/cart.ts
import axios from "./api"; // ✅ มี baseURL / withCredentials / interceptors แล้ว
import type { Cart, CartItem } from "../types";

export type CartSummary = { total_qty: number; subtotal: number };

export type CartMeResponse = Cart & {
  items: (CartItem & {
    sku?: string;
    shade_name?: string;
    shade_code?: string;
    image_url?: string | null;
    price_now?: number;
    stock_qty?: number;
  })[];
  summary: CartSummary;
};

/** ดึงตะกร้าของฉัน (ใช้ axios instance เพื่อให้ headers/cookies ทำงานอัตโนมัติ) */
export async function getCartMe(): Promise<CartMeResponse> {
  const { data } = await axios.get<CartMeResponse>("/api/cart/me", {
    // ถ้าจำเป็นต้องแนบ token เอง และ interceptor ไม่ได้ทำให้:
    // headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") ?? ""}` }
  });
  return data;
}

export async function addToCart(
  variant_id: number,
  qty = 1
): Promise<CartMeResponse> {
  const { data } = await axios.post<CartMeResponse>("/api/cart/items", {
    variant_id,
    qty,
  });
  return data;
}

export async function setCartItemQty(
  itemId: number,
  qty: number
): Promise<CartMeResponse> {
  const { data } = await axios.patch<CartMeResponse>(
    `/api/cart/items/${itemId}`,
    { qty }
  );
  return data;
}

export async function removeCartItem(itemId: number): Promise<CartMeResponse> {
  const { data } = await axios.delete<CartMeResponse>(
    `/api/cart/items/${itemId}`
  );
  return data;
}

/**
 * เคลียร์ตะกร้าทั้งหมด
 * - พยายามเรียก POST /api/cart/clear ก่อน (ถ้ามี)
 * - ถ้าไม่มี endpoint ดังกล่าว (404/405) จะ fallback เป็นการลบไอเท็มทั้งหมดทีละตัว
 * - ส่งผลลัพธ์ตะกร้าปัจจุบันกลับมา
 */
export async function clearCart(): Promise<CartMeResponse> {
  try {
    const { data } = await axios.post<CartMeResponse>("/api/cart/clear");
    return data;
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 404 || status === 405) {
      // 🟡 ไม่มี /api/cart/clear → ลบทีละชิ้นแทน
      const current = await getCartMe();
      const ids = current.items.map((i) => i.id);
      await Promise.all(
        ids.map((id) => axios.delete(`/api/cart/items/${id}`))
      );
      const after = await getCartMe();
      return after;
    }
    throw err;
  }
}
