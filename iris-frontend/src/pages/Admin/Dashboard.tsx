import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllOrders, type OrderListItem } from "../../services/orders";
import { getAllProducts, getAllUsers } from "../../services/admin"; // สมมติว่ามี API
import "./Orders.css";

const fmtTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n || 0);

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [products, setProducts] = useState<number>(0);
  const [customers, setCustomers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const totalSales = orders.reduce((sum, order) => {
  return sum + Number(order.grand_total || 0);
}, 0);



  useEffect(() => {
    (async () => {
      try {
        const [ordersList, productsList, usersList] = await Promise.all([
          getAllOrders(),
          getAllProducts(),
          getAllUsers(),
        ]);
        setOrders(ordersList);
        setProducts(productsList.length);
        setCustomers(usersList.filter((u: typeof usersList[number]) => u.role === "CUSTOMER").length);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="panel">
      <h1 className="panel__title">Dashboard</h1>

      {loading && <p>Loading…</p>}

      {!loading && (
        <>
          {/* KPI */}
          <div className="kpi" style={{ display: "flex", gap: "24px", marginBottom: "32px" }}>
            <div className="kpi__card">
              <div className="kpi__label">Total Sales</div>
              <div className="kpi__value">{fmtTHB(totalSales)}</div>
            </div>
            <div className="kpi__card">
              <div className="kpi__label">Total Orders</div>
              <div className="kpi__value">{orders.length}</div>
            </div>
            <div className="kpi__card">
              <div className="kpi__label">Products</div>
              <div className="kpi__value">{products}</div>
            </div>
            <div className="kpi__card">
              <div className="kpi__label">Customers</div>
              <div className="kpi__value">{customers}</div>
            </div>
          </div>

        <h1 className="panel__title">All Orders</h1>
          {/* All Orders Table */}
          <div className="panel__content">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Customer</th> {/* เพิ่ม column */}
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
  {orders.map(o => (
    <tr
      key={o.id}
      className="hover-row clickable-row"
      onClick={() => navigate(`/admin/orders/${o.id}`)}
    >
      <td>#{o.id}</td>
      <td>{new Date(o.created_at).toLocaleString()}</td>
      <td>{o.customer_name}</td> {/* แสดงชื่อ */}
      <td>
        <span className={`pill pill--${o.status.toLowerCase()}`}>
          {o.status}
        </span>
      </td>
      <td>{fmtTHB(o.grand_total)}</td>
      <td>→</td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
