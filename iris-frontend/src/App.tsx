// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import type { JSX } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Shop from "./pages/Shop";
import Footer from "./components/Footer";
import Verify from "./pages/Verify";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import CategoryPage from "./pages/Categories";
import PaymentPage from "./pages/Payment";

// Admin
import AdminHome from "./pages/Admin/AdminHome";
import AdminDashboard from "./pages/Admin/Dashboard";

import AdminOrders from "./pages/Admin/Orders"; // mock Orders
import OrderDetail from "./pages/Admin/OrderDetail"; // mock OrderDetail

import AdminCategories from "./pages/Admin/AdminCategories";

import AdminProducts from "./pages/Admin/Products";
import AddProduct from "./pages/Admin/AddProduct";

import { useAuth } from "./context/AuthContext";
import ProductDetails from "./pages/Detail";
import CartPage from "./pages/Cart";
import MyOrders from "./pages/Myorders";
import UserOrderDetail from "./pages/OrderDetail";

/* ---------- Guard ---------- */
function RequireAuth({
  children,
  role,
}: {
  children: JSX.Element;
  role?: "admin" | "user";
}) {
  const { currentUser, isReady } = useAuth();
  const location = useLocation();
  if (!isReady) {
    return (
      <div
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <div>Loading…</div>
      </div>
    );
  }

  if (!currentUser) {
    // ✅ ส่งไปหน้า login พร้อมจำปลายทาง (ไม่ใช่ /home)
    return <Navigate to="/home" replace state={{ from: location }} />;
  }

  const roleMap: Record<"admin" | "user", "ADMIN" | "CUSTOMER"> = {
    admin: "ADMIN",
    user: "CUSTOMER",
  };
  const userRole = String(currentUser.role || "").toUpperCase();
  if (role && userRole !== roleMap[role]) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

/* ---------- หน้า Home ที่ฉลาด: แอดมิน -> /admin ---------- */
function HomeOrAdmin() {
  const { currentUser, isReady } = useAuth();
  if (!isReady) {
    return (
      <div
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        Loading…
      </div>
    );
  }
  const role = String(currentUser?.role || "").toUpperCase();
  return role === "ADMIN" ? <Navigate to="/admin" replace /> : <Home />;
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

function LogoutInline() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        await logout();
      } finally {
        sessionStorage.removeItem("return_to_path");
        sessionStorage.removeItem("return_needs_role");
        navigate("/home", { replace: true }); // จะเปลี่ยนเป็น /home ก็ได้
      }
    })();
  }, [logout, navigate]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      Signing you out…
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const { isReady } = useAuth();
  if (!isReady) {
    return (
      <div
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <div>Loading…</div>
      </div>
    );
  }

  const isAdminPath = location.pathname.startsWith("/admin");

  return (
    <div className="app-shell" id="app-shell">
      {!isAdminPath && <Navbar />}

      <Routes>
        {/* public */}
        <Route path="/" element={<HomeOrAdmin />} />
        <Route path="/home" element={<HomeOrAdmin />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* <Route path="/categories/:subcategory" element={<Categories />} /> */}
        <Route path="/categories/:slug" element={<CategoryPage />} />

        {/* Protected user routes */}
        {/* product detail (public) */}
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />

        <Route
          path="/payment"
          element={
            <RequireAuth>
              <PaymentPage />
            </RequireAuth>
          }
        />

          <Route
            path="/my-orders"
            element={
              <RequireAuth>
                <MyOrders />
              </RequireAuth>
            }
          />
          <Route
            path="/my-orders/:orderId"
            element={
              <RequireAuth>
                <UserOrderDetail />
              </RequireAuth>
            }
          />
          <Route path="/payment/:orderId" element={<PaymentPage />} />
          {/* user */}
          <Route
            path="/shop"
            element={
              <RequireAuth role="user">
                <Shop />
              </RequireAuth>
            }
          />

        {/* Admin + nested */}
        <Route
          path="/admin/*"
          element={
            <RequireAuth role="admin">
              <AdminHome />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} /> {/* mock Orders */}
          <Route path="orders/:id" element={<OrderDetail />} />{" "}
          {/* mock OrderDetail */}
          <Route path="categories" element={<AdminCategories />} />
          {/* <Route path="orders" element={<AdminOrders />} /> */}
          <Route path="products" element={<AdminProducts />} />
          <Route path="add-product" element={<AddProduct />} />
        </Route>
        <Route path="/auth/logout" element={<LogoutInline />} />
        <Route path="/orders" element={<MyOrders />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>

      {!isAdminPath && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppRoutes />
    </Router>
  );
}
