// src/components/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { JSX } from "react";

const RETURN_KEY = "return_to_path";
const NEED_ROLE_KEY = "return_needs_role";

// ปล่อยให้ prop role ใช้ "admin" | "user" ได้ แล้วแมปไปเป็นค่าจริงของระบบ
type RoleProp = "admin" | "user";
const mapRole = (r?: RoleProp) =>
  r === "admin" ? "ADMIN" : r === "user" ? "CUSTOMER" : undefined;

export default function RequireAuth({
  children,
  role,
}: { children: JSX.Element; role?: RoleProp }) {
  const { currentUser, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) return null; // จะใส่ spinner ก็ได้

  // ❌ ยังไม่ล็อกอิน → จำปลายทาง แล้วพาไปหน้า Login
  if (!currentUser) {
    const target = location.pathname + location.search + location.hash;
    sessionStorage.setItem(RETURN_KEY, target);
    if (role) sessionStorage.setItem(NEED_ROLE_KEY, role);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ❌ role ไม่ตรง → ส่งกลับหน้า Home (หรือจะส่งไป 403 page ก็ได้)
  const needRole = mapRole(role);
  if (needRole && currentUser.role !== needRole) {
    return <Navigate to="/home" replace />;
  }

  // ✅ ผ่านแล้ว เคลียร์ค่าที่จำไว้
  sessionStorage.removeItem(RETURN_KEY);
  sessionStorage.removeItem(NEED_ROLE_KEY);

  return children;
}
