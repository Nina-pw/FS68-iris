//Dashboard
//Orders management
//Products list
//Add products

import { NavLink, Outlet } from "react-router-dom";
import AdminTopbar from "../../components/AdminTopbar";
import "./AdminHome.css";

export default function AdminHome() {
  return (
    <div className="adm">
      {/* Topbar */}
      <AdminTopbar />

      <div className="adm__body">
        {/* Sidebar */}
        <aside className="adm__side">
          <div className="adm__sectTitle">Main menu</div>
          <NavLink end to="/admin" className="adm__item">Dashboard</NavLink>
          <NavLink to="/admin/orders" className="adm__item">Order Management</NavLink>
          {/* <NavLink to="/admin/customers" className="adm__item">Customers</NavLink> */}
          <NavLink to="/admin/categories" className="adm__item">Categories</NavLink>

          <div className="adm__sectTitle">Product</div>
          <NavLink to="/admin/products" className="adm__item">Product List</NavLink>
          <NavLink to="/admin/add-product" className="adm__item">Add Products</NavLink>

          {/* <div className="adm__sectTitle">Admin</div>
          <NavLink to="/admin/roles" className="adm__item">Admin role</NavLink> */}
        </aside>

        {/* ที่วางเนื้อหาแต่ละหน้า */}
        <main className="adm__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
