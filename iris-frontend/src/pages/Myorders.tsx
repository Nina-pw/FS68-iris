import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders, type OrderListItem } from "../services/orders";
import "./Myorders.css";

const fmtTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(n || 0);

function StatusBadge({ status }: { status: string }) {
  const s = String(status).toUpperCase();
  return <span className={`status-badge status-${s.toLowerCase()}`}>{s}</span>;
}

export default function MyOrders() {
  const [orders, setOrders] = useState<OrderListItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  const lastOrderId = useMemo(() => {
    const s = sessionStorage.getItem("last_order_id");
    return s ? Number(s) : null;
  }, []);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const list = await getMyOrders();
      setOrders(list);
    } catch (err) {
      console.error("❌ Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="orders-container">
      <h1 className="orders-title">My Orders</h1>

      {loading && <p>Loading…</p>}
      {!loading && (!orders || orders.length === 0) && <p>ยังไม่มีคำสั่งซื้อ</p>}

      {!loading && orders && orders.length > 0 && (
        <div className="orders-table">
          <div className="orders-head">
            <span>#</span>
            <span>Status</span>
            <span>Created</span>
            <span>Total</span>
            <span>Actions</span>
          </div>

          <div className="orders-body">
            {orders.map((o) => (
              <div
                key={o.id}
                className={`orders-row ${lastOrderId === o.id ? "is-latest" : ""}`}
              >
                <span>#{o.id}</span>
                <span>
                  <StatusBadge status={o.status} />
                </span>
                <span>{new Date(o.created_at).toLocaleString()}</span>
                <span>{fmtTHB(o.grand_total)}</span>
                <span className="order-actions">
                  <Link to={`/my-orders/${o.id}`} className="btn-link">
                    ดูรายละเอียด
                  </Link>
                  {/* {o.status === "PENDING" && (
                    <button
                      className="btn-cancel"
                      style={{
                        marginLeft: 8,
                        background: "#dc3545",
                        color: "#fff",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: 5,
                        cursor: "pointer",
                      }}
                      onClick={() => handleCancel(o.id)}
                    >
                      ยกเลิก
                    </button>
                  )} */}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
