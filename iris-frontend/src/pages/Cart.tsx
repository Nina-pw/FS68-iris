import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getCartMe,
  setCartItemQty,
  removeCartItem,
  type CartMeResponse,
} from "../services/cart";
import "./Cart.css";
// import { createOrder } from "../services/payment";
// import { getPaymentMe } from "../services/payment";
import { api } from "../services/api";
import { useCart } from "../context/CartContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const extractPidFromSku = (sku?: string | null) => {
  if (!sku) return null;
  const m = String(sku).match(/^SKU-(\d+)-/i);
  return m ? Number(m[1]) : null;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

export default function CartPage() {
  const [data, setData] = useState<CartMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();
  const [nameMap, setNameMap] = useState<Record<number, string>>({});
  const cartCtx = useCart?.() as any; // มีไว้เคลียร์ badge หลังเช็คเอาต์

  const subtotal = useMemo(
    () => Number(data?.summary?.subtotal ?? 0),
    [data?.summary?.subtotal]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await getCartMe();
        setData(d);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const items = data?.items ?? [];
    if (!items.length) {
      setNameMap({});
      return;
    }

    // รวม p_id จากหลายกรณี + ถอดจาก SKU
    const pids = new Set<number>();
    for (const it of items as any[]) {
      const direct =
        it.p_id ?? it.product_id ?? it.pid ?? extractPidFromSku(it.sku);
      if (Number.isFinite(direct)) pids.add(Number(direct));
    }
    // กรอง p_id ที่มีอยู่แล้วใน nameMap แล้ว
    const need = [...pids].filter((id) => !nameMap[id]);
    if (need.length === 0) return;

    (async () => {
      try {
        const pairs: Array<[number, string]> = await Promise.all(
          need.map(async (pid) => {
            // ใช้ endpoint เดิมของหน้า detail
            const r = await fetch(`${API_BASE}/api/products/${pid}`, {
              credentials: "include",
              cache: "no-store",
            });
            if (!r.ok) return [pid, `#${pid}`] as [number, string];
            const p = await r.json();
            const pname = p?.pname ?? p?.name ?? p?.title ?? `#${pid}`;
            return [pid, String(pname)] as [number, string];
          })
        );
        setNameMap((prev) => {
          const next = { ...prev };
          for (const [pid, name] of pairs) next[pid] = name;
          return next;
        });
      } catch {
        // เงียบ ๆ ไป แสดง fallback ต่อได้
      }
    })();
  }, [data?.items, API_BASE]); // อย่าลืม dependency

  const onChangeQty = async (itemId: number, nextQty: number) => {
    if (nextQty < 1) return;
    setBusyId(itemId);
    try {
      const d = await setCartItemQty(itemId, nextQty);
      setData(d);
    } finally {
      setBusyId(null);
    }
  };

  const onRemove = async (itemId: number) => {
    setBusyId(itemId);
    try {
      const d = await removeCartItem(itemId);
      setData(d);
    } finally {
      setBusyId(null);
    }
  };

  const handleCheckout = async () => {
    if (checkingOut) return;
    setCheckingOut(true);
    try {
      // ✅ เช็คเอาต์ที่ backend (สร้างออเดอร์ + ล้าง cart ใน DB)
      const res = await api.checkout(); // POST /api/orders/checkout
      const orderId = res?.orderId;

      // ✅ เคลียร์ตะกร้าฝั่ง client ให้ UI ว่างทันที & badge หาย
      setData({ items: [], summary: { subtotal: 0, total_qty: 0 } } as any);
      // cartCtx?.setCart?.({ items: [], summary: { subtotal: 0, total_qty: 0 } });
         // ✅ เคลียร์ใน Context ให้ Navbar อัปเดตเลขทันที
   cartCtx?.clearLocal?.();       // ถ้ามีเมธอดนี้ใน Context
   // (ออปชัน) sync จากเซิร์ฟเวอร์อีกทีเพื่อความชัวร์
   cartCtx?.refresh?.();

      // จำออเดอร์ล่าสุดไว้ไปไฮไลต์ใน MyOrders
      if (orderId) sessionStorage.setItem("last_order_id", String(orderId));

      // ➜ ทางเลือกการนำทาง (เลือกอย่างใดอย่างหนึ่ง)
      // 1) ไปหน้ารายการสั่งซื้อล่าสุด
      // if (orderId) return navigate(`/my-orders/${orderId}`);
      // 2) หรือไปหน้าชำระเงินหากยังใช้ flow เดิม:
      return navigate("/payment");
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถสร้างคำสั่งซื้อได้");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <main className="cart-container">
        <h1 className="cart-title">Your Cart</h1>
        <p>Loading…</p>
      </main>
    );
  }

  const items = data?.items ?? [];
  const empty = items.length === 0;

  return (
    <main className="cart-container">
      <h1 className="cart-title">Your Cart</h1>

      {items.length === 0 ? (
        <p className="cart-empty">Your bag is empty.</p>
      ) : (
        <section className="bag">
          {items.map((it) => {
            const unit = Number(it.price_now ?? (it as any).unit_price ?? 0);
            const qty = Number(it.qty ?? 0);
            const line = unit * qty;

            // 1) ลองเอา product id จากหลาย key
            let pId: number | null =
              (it as any).p_id ??
              (it as any).product_id ??
              (it as any).pid ??
              null;

            // 2) ถ้าไม่มี pId ให้ลองถอดจาก SKU: "SKU-<productId>-..."
            if (!pId && it.sku) {
              const m = String(it.sku).match(/^SKU-(\d+)-/i);
              if (m) pId = Number(m[1]);
            }

            const detailHref = pId ? `/product/${pId}` : null;
            const displayName =
              (pId && nameMap[pId]) || // ← ถ้ามีในแมพ ใช้เลย
              (it as any).pname ||
              (it as any).name ||
              (it as any).product_name ||
              (it as any).title ||
              (it.sku ? String(it.sku) : "Product");

            return (
              <article className="bag-item" key={it.id}>
                {/* remove x */}
                <button
                  className="bag-item__remove"
                  aria-label="Remove item"
                  onClick={() => onRemove(it.id)}
                  disabled={busyId === it.id}
                >
                  ×
                </button>

                {/* image */}
                {detailHref ? (
                  <Link
                    to={detailHref}
                    className="bag-item__img"
                    aria-label="Open product detail"
                  >
                    <img
                      src={it.image_url || "/assets/placeholder.png"}
                      alt={it.pname || it.sku || "Item"}
                      loading="lazy"
                    />
                  </Link>
                ) : (
                  <div className="bag-item__img">
                    <img
                      src={it.image_url || "/assets/placeholder.png"}
                      alt={it.pname || it.sku || "Item"}
                      loading="lazy"
                    />
                  </div>
                )}

                {/* info */}
                <div className="bag-item__info">
                  {detailHref ? (
                    <Link to={detailHref} className="bag-item__title">
                      {displayName}
                    </Link>
                  ) : (
                    <div className="bag-item__title">{displayName}</div>
                  )}

                  <div className="bag-item__meta">
                    <span>Shade: {it.shade_name}</span>
                  </div>
                </div>

                {/* price */}
                <div className="bag-item__unit">{fmt(unit)}</div>

                {/* qty control */}
                <div className="bag-item__qty">
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Decrease"
                    onClick={() => onChangeQty(it.id, qty - 1)}
                    disabled={busyId === it.id || qty <= 1}
                  >
                    –
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      onChangeQty(
                        it.id,
                        Math.max(1, Number(e.target.value) || 1)
                      )
                    }
                    disabled={busyId === it.id}
                  />
                  <button
                    type="button"
                    className="qty-btn"
                    aria-label="Increase"
                    onClick={() => onChangeQty(it.id, qty + 1)}
                    disabled={busyId === it.id}
                  >
                    +
                  </button>
                </div>

                {/* line total */}
                <div className="bag-item__line">{fmt(line)}</div>
              </article>
            );
          })}

          <footer className="bag-footer">
            <div className="bag-footer__row">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
          </footer>
        </section>
      )}
      {/* ==== Sticky Checkout Bar (แบบเต็มกว้างกดได้ทั้งแถบ) ==== */}
      {/* {!empty && (
        <Link to="#" onClick={handleCheckout} className="checkout-fullbar">
          <span className="checkout-fullbar__amount">{fmt(subtotal)}</span>
          <span className="checkout-fullbar__dot">•</span>
          <span className="checkout-fullbar__label">CHECKOUT</span>
        </Link>
      )} */}
      {!empty && (
        <button
          type="button"
          onClick={handleCheckout}
          className="checkout-fullbar"
          disabled={checkingOut}
        >
          <span className="checkout-fullbar__amount">{fmt(subtotal)}</span>
          <span className="checkout-fullbar__dot">•</span>
          <span className="checkout-fullbar__label">
            {checkingOut ? "PROCESSING…" : "CHECKOUT"}
          </span>
        </button>
      )}
    </main>
  );
}
