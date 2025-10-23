// src/services/payment.ts
import apiClient from "./api";

/** ดึงข้อมูลออเดอร์ล่าสุดของฉัน */
export async function getPaymentMe() {
  const { data } = await apiClient.get("/api/payment/me");
  return data as {
    orderId: number;
    items: Array<{
      id: number;
      name: string | null;
      shadeName: string | null;
      unitPrice: string;
      qty: number;
      lineTotal: string;
      imageUrl?: string | null;
    }>;
    subtotal: number;
    shippingFee: number;
    grandTotal: number;
    status: "PENDING" | "PAID" | string;
    scbTransactionId?: string | null;
    scbQrId?: string | null;
  };
}

/** สร้างออเดอร์ + ขอ QR จาก SCB (รองรับ v1/v2) */
export async function createScbQr() {
  const { data } = await apiClient.post("/api/payment/scb/qr");
  // backend อาจส่งมาเป็น v1 หรือ v2
  return data as {
    orderId: number;
    amount: number | string;
    // อย่างใดอย่างหนึ่งจะมีค่า
    qrImageUrl?: string; // v2
    qrRawData?: string; // v1 (EMV string)
    transactionId?: string; // อาจไม่มี (เราใช้ orderId + ref1 ทำ inquiry ได้)
    expiresAt?: string;
  };
}

/** เช็คสถานะธุรกรรม (poll ด้วย orderId พอ) */
export async function getScbStatus(params: { orderId: number }) {
  const { data } = await apiClient.get("/api/payment/scb/status", {
    params: { orderId: params.orderId },
  });
  return data as { status: string; raw: any };
}

/** (ไม่ใช้แล้ว) */
export async function confirmPayment(orderId: number) {
  const { data } = await apiClient.post("/api/payment/confirm", { orderId });
  return data;
}
