// src/services/api.ts
import axios, { AxiosError } from "axios";

// ========================= 🔧 ตั้งค่าเบื้องต้น =========================
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ ให้ส่ง cookie ทุก request
  headers: {
    "Content-Type": "application/json",
  },
});

// ========================= 🔑 แนบ Bearer token ทุก request =========================
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========================= ♻️ รีเฟรช token อัตโนมัติเมื่อ 401 =========================
let refreshing: Promise<any> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const status = err.response?.status;
    const original: any = err.config;

    // ป้องกันลูป refresh
    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        // ยิง refresh token (อ่านจาก cookie)
        refreshing = refreshing || apiClient.post("/auth/refresh", {}, { withCredentials: true });
        const { data } = await refreshing;
        refreshing = null;

        // ถ้ามี accessToken ใหม่ → อัปเดตใน localStorage
        if (data?.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
          apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
        }

        // ยิงคำขอเดิมซ้ำ
        return apiClient(original);
      } catch (e) {
        refreshing = null;
        console.warn("❌ Token refresh failed");
      }
    }

    return Promise.reject(err);
  }
);

// ========================= 📦 รวม helper API =========================
export const api = {
  // ---------- 🛍️ สินค้า ----------
  async getProducts() {
    const { data } = await apiClient.get("/api/products");
    return data;
  },
  async getCategories() {
    const { data } = await apiClient.get("/api/shop/categories");
    return data;
  },

  // ---------- 👤 ผู้ใช้ ----------
  async getUsers() {
    const { data } = await apiClient.get("/users");
    return data;
  },
  async getMe() {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },

  // ---------- 🧾 ออเดอร์ ----------
  async getOrdersMe() {
   const { data } = await apiClient.get("/api/orders/me");
   return data;
 },
   async checkout() {
   const { data } = await apiClient.post("/api/orders/checkout");
   return data;
 },

  // ---------- 🛒 ตะกร้า ----------
  async getCart() {
    const { data } = await apiClient.get("/api/cart/me");
    return data;
  },
  async addToCart(variantId: number, qty = 1) {
    const { data } = await apiClient.post("/api/cart/items", {
      variant_id: variantId,
      qty,
    });
    return data;
  },
  async updateCartItemQty(itemId: number, qty: number) {
    const { data } = await apiClient.patch(`/api/cart/items/${itemId}`, { qty });
    return data;
  },
  async deleteCartItem(itemId: number) {
    const { data } = await apiClient.delete(`/api/cart/items/${itemId}`);
    return data;
  },

  // ---------- 💳 ชำระเงิน ----------
async getPaymentInfo() {
  const { data } = await apiClient.get("/api/payment/me");
  return data;
},
async createScbQR() {
  const { data } = await apiClient.post("/api/payment/scb/qr");
  // { orderId, amount, qrImageUrl?, qrRawData?, transactionId?, expiresAt? }
  return data;
},
async getScbTxStatus(orderId: number) {
  const { data } = await apiClient.get("/api/payment/scb/status", {
    params: { orderId },
  });
  return data;
},



  // ---------- 🔐 การเข้าสู่ระบบ ----------
  async login(email: string, password: string) {
    const { data } = await apiClient.post("/auth/login", { email, password });
    if (data?.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
    }
    return data;
  },
  async register(payload: { email: string; password: string; name?: string }) {
    const { data } = await apiClient.post("/auth/register", payload);
    return data;
  },
  async logout() {
    await apiClient.post("/auth/logout");
    localStorage.removeItem("accessToken");
  },
};

// ✅ export alias เผื่อไฟล์อื่น import
export const apiCalls = api;
export default apiClient;
