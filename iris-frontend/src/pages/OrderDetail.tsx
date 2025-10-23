import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderDetail, type OrderDetailResponse } from "../services/orders";
import "./OrderDetail.css";

const fmtTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(n || 0);

export default function OrderDetail() {
  const { orderId } = useParams();
  const [data, setData] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      setLoading(true);
      try {
        const d = await getOrderDetail(Number(orderId));
        setData(d);
      } catch (e) {
        console.error("❌ Load order detail failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading)
    return (
      <main className="orderdetail-container">
        <p>Loading…</p>
      </main>
    );
  if (!data)
    return (
      <main className="orderdetail-container">
        <p>ไม่พบคำสั่งซื้อ</p>
      </main>
    );

  return (
    <main className="orderdetail-container">
      <div className="od-header">
        <h1>Order #{data.id}</h1>
        <Link to="/my-orders" className="back-link">
          ← กลับไป My Orders
        </Link>
      </div>

      <div className="od-meta">
        <div>
          <strong>Status:</strong> {data.status}
        </div>
        <div>
          <strong>Created:</strong> {new Date(data.created_at).toLocaleString()}
        </div>
        <div>
          <strong>Updated:</strong> {new Date(data.updated_at).toLocaleString()}
        </div>
      </div>

      <div className="od-items">
        {data.items.map((it) => (
          <div className="od-item" key={it.id}>
            <img
              src={it.image_url || "/assets/placeholder.png"}
              alt={it.name}
            />
            <div className="od-item__info">
              <div className="name">{it.name}</div>
              {it.shade_name ? (
                <div className="shade">Shade: {it.shade_name}</div>
              ) : null}
              <div className="price">Unit: {fmtTHB(it.unit_price)}</div>
            </div>
            <div className="od-item__qty">x {it.qty}</div>
            <div className="od-item__line">{fmtTHB(it.line_total)}</div>
          </div>
        ))}
      </div>

      <div className="od-summary">
        <div className="row">
          <span>Subtotal</span>
          <span>{fmtTHB(data.subtotal)}</span>
        </div>
        <div className="row">
          <span>Shipping</span>
          <span>{fmtTHB(data.shipping_fee)}</span>
        </div>
        {data.discount_total ? (
          <div className="row">
            <span>Discount</span>
            <span>-{fmtTHB(data.discount_total)}</span>
          </div>
        ) : null}
        <div className="row total">
          <strong>Total</strong>
          <strong>{fmtTHB(data.grand_total)}</strong>
        </div>
      </div>

      {/* ✅ ปุ่มชำระเงิน */}
      {data.status === "PENDING" && (
        <div className="od-actions">
          <Link
            to={`/payment/${data.id}`}
            className="btn-pay"
            style={{
              display: "inline-block",
              marginTop: 16,
              padding: "10px 20px",
              backgroundColor: "#821416ff",
              color: "#fff",
              borderRadius: 6,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            ชำระเงิน
          </Link>
        </div>
      )}
    </main>
  );
}
