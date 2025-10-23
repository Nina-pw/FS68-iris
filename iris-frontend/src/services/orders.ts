// src/services/orders.ts
import { apiClient } from "./api";

export type OrderListItem = {
  id: number;
  status: "PENDING" | "PAID" | "CANCELLED" | string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
};

export type OrderDetailItem = {
  id: number;
  product_id: number;
  variant_id: number | null;
  name: string;
  shade_name?: string | null;
  unit_price: number;
  qty: number;
  line_total: number;
  image_url?: string | null;
};

export type OrderDetailResponse = {
  id: number;
  status: string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
  items: OrderDetailItem[];
  customer_name?: string;
};

// ✅ ใช้ apiClient แทน fetch เพื่อให้แนบโทเคนอัตโนมัติ
export async function getMyOrders(): Promise<OrderListItem[]> {
  const { data } = await apiClient.get<OrderListItem[]>("/api/orders/me");
  return data;
}

export async function getOrderDetail(orderId: number): Promise<OrderDetailResponse> {
  const { data } = await apiClient.get<OrderDetailResponse>(`/api/orders/${orderId}`);
  return data;
}

// ✅ ดึงรายการคำสั่งซื้อทั้งหมด (สำหรับ admin)
export async function getAllOrders(): Promise<OrderListItem[]> {
  const { data } = await apiClient.get<OrderListItem[]>("/api/admin/orders");
  return data;
}

// ✅ ดึงรายละเอียดคำสั่งซื้อ (สำหรับ admin)
export async function getAdminOrderDetail(orderId: number): Promise<OrderDetailResponse> {
  const { data } = await apiClient.get<OrderDetailResponse>(`/api/admin/orders/${orderId}`);
  return data;
}
