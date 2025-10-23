// src/pages/Verify.tsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    async function verifyEmail() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/verify?token=${token}&email=${email}`
        );
        if (res.ok) {
          setStatus("success");
          setMessage("✅ Email verified successfully! Redirecting to login...");
          setTimeout(() => navigate("/login"), 2500);
        } else {
          const data = await res.json();
          setStatus("error");
          setMessage(data.error || "❌ Verification failed. Link may be expired.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("⚠️ Could not connect to server. Please try again later.");
      }
    }

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h2>Email Verification</h2>
      <p>{message}</p>
      {status === "loading" && <p>⏳ Please wait...</p>}
    </div>
  );
}
