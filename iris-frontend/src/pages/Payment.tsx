// src/pages/PaymentPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { getPaymentMe, createScbQr, getScbStatus } from "../services/payment";
import "./Payment.css";
import apiClient from "../services/api";

type PaymentItem = {
  id: number;
  name: string | null;
  shadeName?: string | null;
  unitPrice: string;
  qty: number;
  lineTotal: string;
  imageUrl?: string | null;
};

type PaymentMe = {
  orderId: number;
  items: PaymentItem[];
  subtotal: number | string;
  shippingFee: number | string;
  grandTotal: number | string;
  status: string; // PENDING/PAID
  scbTransactionId?: string | null;
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<PaymentMe | null>(null);

  // SCB QR data
  const [qrRawData, setQrRawData] = useState<string>(""); // v1
  const [qrImageUrl, setQrImageUrl] = useState<string>(""); // v2
  const [orderId, setOrderId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const lastOrderId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("last_order_id")
      : null;

  const sseRef = useRef<EventSource | null>(null);

  function listenPaid(ordId: number) {
    // ถ้ามี auth ด้วย cookie อยู่แล้วก็พอ; ถ้าต้องใช้ JWT ใส่ ?jwt=... เอง
    const url = `${
      import.meta.env.VITE_API_URL ?? "http://localhost:3000"
    }/api/payment/events/${ordId}`;
    const es = new EventSource(url, { withCredentials: true });
    sseRef.current = es;

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (String(data?.status).toUpperCase() === "PAID") {
          stopPolling(); // ยังเก็บ polling เป็น fallback ได้
          es.close();
          navigate(`/my-orders/${ordId}`, { replace: true });
        }
      } catch {}
    };

    es.onerror = () => {
      // ถ้า SSE หลุด ปล่อยให้ polling ทำงานต่อ
      es.close();
      sseRef.current = null;
    };
  }

  useEffect(() => {
    return () => {
      sseRef.current?.close();
      sseRef.current = null;
    };
  }, []);

  // โหลดสรุปออเดอร์ล่าสุด (ฝั่งขวา)
  useEffect(() => {
    (async () => {
      try {
        const r = await getPaymentMe();
        setMe(r);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Load payment failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // เริ่มสร้าง QR กับ SCB
  async function startPayment() {
    if (paying) return;
    setError(null);
    setPaying(true);
    try {
      // backend อาจคืน v1 หรือ v2
      const r = await createScbQr();
      setOrderId(r.orderId);
      setExpiresAt(r.expiresAt ?? null);
      setQrImageUrl(r.qrImageUrl || "");
      setQrRawData(r.qrRawData || "");

      sessionStorage.setItem("last_order_id", String(r.orderId));
      listenPaid(r.orderId); // <<<<<< ฟังผลแบบทันที
      startPolling(r.orderId);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Create SCB QR failed");
    } finally {
      setPaying(false);
    }
  }

  function startPolling(ordId: number) {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const r = await getScbStatus({ orderId: ordId });
        const st = String(r.status || "").toUpperCase();
        if (st === "PAID" || st === "SUCCESS") {
          stopPolling();
          navigate(`/my-orders/${ordId}`, { replace: true }); // ← ใช้ ordId โดยตรง
        }
        if (st === "TIMEOUT" || st === "CANCELLED") {
          stopPolling();
          setError("QR code expired. Please try again.");
        }
      } catch (e) {
        console.warn("poll error:", e);
      }
    }, 5000);
  }

  function stopPolling() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => () => stopPolling(), []);

  const amountText = useMemo(
    () => (me ? Number(me.grandTotal).toFixed(2) : "0.00"),
    [me]
  );

  if (loading) {
    return (
      <main className="checkout-container">
        <p>Loading...</p>
      </main>
    );
  }
  if (!me) {
    return (
      <main className="checkout-container">
        <p>ไม่พบข้อมูลคำสั่งซื้อ</p>
        {error && <p className="text-danger">{error}</p>}
      </main>
    );
  }

  return (
    <main className="checkout-container">
      <div className="checkout-left">
        <section className="payment-section">
          <h2>Payment</h2>
          <p className="text-muted small">
            All transactions are secure and encrypted.
          </p>

          <div className="qr-box">
            <h5>SCB QR</h5>

            {qrImageUrl || qrRawData ? (
              <>
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="SCB QR"
                    width={180}
                    height={180}
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <QRCode value={qrRawData} size={180} />
                )}

                <div className="qr-meta">
                  <span className="expire">
                    Expires in: <strong>~15 minutes</strong>
                  </span>
                  <span className="due">
                    Due on:{" "}
                    {expiresAt ? new Date(expiresAt).toLocaleString() : "—"}
                  </span>
                </div>
              </>
            ) : (
              <button
                className="btn-primary"
                disabled={paying}
                onClick={startPayment}
                style={{ width: 220 }}
              >
                {paying ? "Generating..." : "ชำระเงินด้วย SCB QR"}
              </button>
            )}
            {orderId && import.meta.env.MODE !== "production" && (
              <button
                className="btn-secondary"
                style={{ marginTop: 8 }}
                onClick={async () => {
                  await apiClient.post("/api/payment/scb/simulate-paid", {
                    orderId,
                  });
                  // ไปหน้า orders เลย
                  navigate(`/my-orders/${orderId}`, { replace: true });
                }}
              >
                (DEV) Mark as PAID
              </button>
            )}

            <p className="total">Total: ฿{amountText}</p>
            {error && (
              <p className="text-danger" style={{ marginTop: 8 }}>
                {error}
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="checkout-right">
        <h3>Your Order</h3>
        <ul className="order-list">
          {me.items.map((it) => (
            <li key={it.id} className="order-item">
              <div className="item-left">
                <div className="qty-badge">{it.qty}</div>
                <img
                  src={it.imageUrl || "https://via.placeholder.com/60"}
                  alt={it.name ?? ""}
                />
                <div>
                  <p className="name">{it.name}</p>
                  {it.shadeName && <p className="shade">{it.shadeName}</p>}
                </div>
              </div>
              <div className="item-right">
                {parseFloat(it.unitPrice) === 0 ? (
                  <p>FREE</p>
                ) : (
                  <p>฿{it.unitPrice}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>฿{Number(me.subtotal).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>
              {Number(me.shippingFee) === 0
                ? "Free"
                : `฿${Number(me.shippingFee).toFixed(2)}`}
            </span>
          </div>
          <div className="summary-total">
            <strong>Total</strong>
            <strong>฿{amountText}</strong>
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ marginTop: 12, width: "100%" }}
          onClick={() =>
            navigate(lastOrderId ? `/my-orders/${lastOrderId}` : "/my-orders")
          }
        >
          {lastOrderId ? "ดูคำสั่งซื้อของฉัน (ล่าสุด)" : "ดูคำสั่งซื้อของฉัน"}
        </button>
      </div>
    </main>
  );
}
