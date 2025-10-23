import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getAdminOrderDetail, type OrderDetailResponse } from "../../services/orders";
import "./Orders.css";

const fmtTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n || 0);

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await getAdminOrderDetail(Number(id));
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order detail:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (!order) return <p>Order not found</p>;

  return (
    <main className="order-detail-container">
      <h1>Order #{order.id}</h1>
      <p>Customer: {order.customer_name || "N/A"}</p>
      <p>Status: {order.status}</p>
      <p>Date: {new Date(order.created_at).toLocaleString()}</p>
      <p>Total: {fmtTHB(order.grand_total)}</p>

      <h2>Items</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Shade</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.shade_name || "-"}</td>
              <td>{fmtTHB(item.unit_price)}</td>
              <td>{item.qty}</td>
              <td>{fmtTHB(item.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Link to="/admin/orders" className="btn-link">← Back to Orders</Link>
    </main>
  );
}
