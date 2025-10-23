import type { Key, ReactNode } from "react";

// User
export type UserRole = "admin" | "user";

export interface User {
  userId: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;   // 👈 เพิ่ม role
  remember_token?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

// Category
export interface Category {
  c_id: number;
  pcname: string;
  created_at: string;
  updated_at: string;
}

// Product Variant
export interface ProductVariant {
  id: number;
  p_id: number;
  sku: string;
  shade_name?: string;
  shade_code?: string;
  price: number;
  stock_qty: number;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Product
export interface Product {
  id: Key | null | undefined;
  image: string;
  name: ReactNode;
  price(price: any): import("react").ReactNode;
  p_id: number;
  pname: string;
  description?: string;
  base_price: number;
  pc_id: number; // foreign key to Category
  primary_image_url?: string;
  images?: string[]; // from JSON
  created_at: string;
  updated_at: string;
  variants?: ProductVariant[];
}

// Cart Item
// export interface CartItem {
//   id: number;
//   cart_id: number;
//   variant_id: number;
//   qty: number;
//   unit_price: number;
//   line_total: number;
//   created_at: string;
//   updated_at: string;
// }
export interface CartItem {
  p_id: any;
  product_id: any;
  price_now: any;
  pname: string;
  name: any;
  image_url: string;
  sku: string;
  variant_id: any;
  shade_name: string;
  shade_code: any;
  unit_price(unit_price: any): ReactNode;
  id: number;
  cartId: number;
  variantId: number;
  qty: number;
  unitPrice: number;   // ถ้า backend ส่ง decimal เป็น string ให้เปลี่ยนเป็น number | string
  lineTotal: number;   // เช่น number | string แล้วไป parse ใน service
  createdAt: string;   // ถ้า API บางครั้งไม่ส่ง ให้เปลี่ยนเป็น createdAt?: string
  updatedAt: string;   // เช่น updatedAt?: string
}

// Cart
// export interface Cart {
//   id: number;
//   userID: number;
//   session_id?: string;
//   created_at: string;
//   updated_at: string;
//   items?: CartItem[];
// }
export interface Cart {
  id: number;
  userID: number;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  items?: CartItem[];
}

// Order Item
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  name: string;
  shade_name?: string;
  unit_price: number;
  qty: number;
  line_total: number;
}

// Order
export interface Order {
  id: number;
  userID: number;
  status: string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

// Invoice
export interface Invoice {
  id: number;
  orderID: number;
  number: string;
  issued_at: string;
  status: string;
  created_at: string;
  updated_at: string;
}
