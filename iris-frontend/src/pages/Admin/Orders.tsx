import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrders, type OrderListItem } from "../../services/orders";
import "./Orders.css";

const fmtTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n || 0);

export default function Orders() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const list = await getAllOrders();
        setOrders(list);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="panel">
      <h1 className="panel__title">All Orders</h1>

      {loading && <p>Loading…</p>}
      {!loading && orders.length === 0 && <p>ยังไม่มีคำสั่งซื้อ</p>}

      {!loading && orders.length > 0 && (
        <div className="panel__content">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                {/* <th>Customer</th> */}
                <th>Status</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="hover-row clickable-row"
                  onClick={() => navigate(`/admin/orders/${o.id}`)}
                >
                  <td>#{o.id}</td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                  <td>
                    <span className={`pill pill--${o.status.toLowerCase()}`}>{o.status}</span>
                  </td>
                  <td>{fmtTHB(o.grand_total)}</td>
                  <td>→</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
