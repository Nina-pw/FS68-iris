// src/pages/Login.tsx
import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";
import { FaFacebookF } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const RETURN_KEY = "return_to_path";
const NEED_ROLE_KEY = "return_needs_role";

export default function Login() {
  const { login, isReady, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ถ้า login อยู่แล้ว ให้เด้งตาม role (หรือกลับปลายทางเดิมถ้ามี)
  // ด้านบน: คง auto-redirect ไว้ (ถ้า isReady && currentUser)
  if (!isReady) {
    return (
      <div
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        Loading…
      </div>
    );
  }
  if (isReady && currentUser) {
    const from = (location.state as any)?.from as Location | undefined;
    const fromState = from
      ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
      : undefined;
    const fromStorage = sessionStorage.getItem(RETURN_KEY) || undefined;

    const role = String(currentUser.role || "").toUpperCase();
    const defaultTarget = role === "ADMIN" ? "/admin" : "/shop";
    const target = fromState || fromStorage || defaultTarget;

    sessionStorage.removeItem(RETURN_KEY);
    sessionStorage.removeItem(NEED_ROLE_KEY);

    return <Navigate to={target} replace />;
  }

  // handleSubmit: แค่ login พอ ไม่ต้อง navigate เอง
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      // เมื่อ login สำเร็จ currentUser จะอัปเดต
      // บล็อกด้านบน (isReady && currentUser) จะพาออกให้เอง → ไม่กะพริบ
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-left">
          <img src="/assets/pic1.png" alt="IRIS" className="auth-logo" />
        </div>

        <div className="auth-right">
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2 className="auth-title">Login</h2>

            {error && <p className="auth-error">{error}</p>}

            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="auth-btn auth-btn--primary" type="submit">
              Login
            </button>

            <div className="auth-divider">or</div>

            {/* ใช้ relative path เพื่อให้ผ่าน Vite proxy → ไปที่ backend:3000 */}
            <div className="ft__social">
              <a
                href={`${import.meta.env.VITE_API_URL}/auth/google`}
                className="google"
                aria-label="Sign in with Google"
              >
                <FcGoogle />
              </a>
              <a
                href={`${import.meta.env.VITE_API_URL}/auth/facebook`}
                className="facebook"
                aria-label="Sign in with Facebook"
              >
                <FaFacebookF />
              </a>
            </div>

            <p className="auth-note">
              Don’t have an account? <a href="/register">Register</a>
            </p>

            <div className="auth-meta">
              <a href="/forgot-password" className="auth-link">
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
