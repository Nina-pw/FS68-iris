import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { jwtDecode } from "jwt-decode";

interface User {
  id: number;
  name: string | null;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  avatar?: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  fetchJSON: <T = any>(input: string, init?: RequestInit) => Promise<T>; // wrapper พร้อม refresh
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const STORAGE_KEY = "accessToken";

const API = import.meta.env.VITE_API_URL ?? ""; // ถ้าใช้ proxy/Nginx ให้ปล่อยว่าง

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  function getToken() {
    return localStorage.getItem(STORAGE_KEY);
  }
  function setToken(t: string) {
    localStorage.setItem(STORAGE_KEY, t);
  }
  function clearToken() {
    localStorage.removeItem(STORAGE_KEY);
  }

  async function refreshAccessToken(): Promise<string | null> {
    // เรียก refresh โดยใช้ cookie
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      credentials: "include", // สำหรับรับ/ส่ง refresh cookie
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.accessToken) {
      setToken(data.accessToken);
      return data.accessToken as string;
    }
    return null;
  }

  // fetch wrapper: แนบ Bearer + ถ้า 401 ให้ลอง refresh แล้วรีทราย 1 ครั้ง
  async function fetchJSON<T = any>(
    input: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API}${input}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.status !== 401) {
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
    // 401 → ลอง refresh แล้วรีทราย
    const newToken = await refreshAccessToken();
    if (!newToken) {
      clearToken();
      throw new Error("Unauthorized");
    }
    const res2 = await fetch(`${API}${input}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
        Authorization: `Bearer ${newToken}`,
      },
    });
    if (!res2.ok) throw new Error(await res2.text());
    return res2.json();
  }

  // อ่าน token + avatar จาก query (สำหรับ OAuth) หรือจาก localStorage, แล้วยืนยันด้วย /auth/me
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromQuery = params.get("token");
        const avatarFromQuery = params.get("avatar") ?? undefined;

        if (tokenFromQuery) {
          setToken(tokenFromQuery);
          // ล้าง query ออกจาก URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }

        let token = tokenFromQuery ?? getToken();
        if (!token) {
          setIsReady(true);
          return;
        }

        // พยายามโหลดโปรไฟล์จริงจาก backend
        try {
          const me = await fetchJSON<User>("/auth/me");
          setCurrentUser({
            ...me,
            avatar: avatarFromQuery ?? me.avatar ?? null,
          });
        } catch {
          // ถ้า /me ล้มเหลว → ลอง refresh แล้ว /me อีกครั้ง
          const newToken = await refreshAccessToken();
          if (newToken) {
            const me = await fetchJSON<User>("/auth/me");
            setCurrentUser(me);
          } else {
            clearToken();
            setCurrentUser(null);
          }
        }
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // เพื่อเก็บ refresh cookie
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    // เก็บ access token
    setToken(data.accessToken);

    // ตั้ง currentUser จาก response ที่ backend ส่งมา (ชัวร์กว่า decode)
    const user: User =
      data.user ??
      (() => {
        const decoded: any = jwtDecode(data.accessToken);
        return {
          id: decoded.userId,
          name: decoded.name ?? null,
          email: decoded.email,
          role: decoded.role,
          avatar: decoded.avatar ?? null,
        } as User;
      })();

    setCurrentUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    clearToken();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isReady,
        login,
        logout,
        isAdmin: currentUser?.role === "ADMIN",
        fetchJSON,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
