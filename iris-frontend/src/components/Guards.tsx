import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { JSX } from "react";

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/" replace />;
}

export function RequireAdmin({ children }: { children: JSX.Element }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/" replace />;

  // ✅ แก้ role ให้ตรงชนิดจริง
  if (currentUser.role.toUpperCase() !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return children;
}
