// src/components/ProductCard.tsx
import { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Swal from "sweetalert2";
import { flyToCart, getCartIconEl } from "../utils/flyToCart";
import { selectShadeAlert, minimalToast, minimalAlert } from "../utils/alerts";
import "./ProductCard.css";

/** -------- Types ที่ยืดหยุ่นกับโครงสร้าง API -------- */
type ProductLike = {
  id?: number | string;
  p_id?: number | string;

  name?: string;
  pname?: string;

  price?: number | string;
  base_price?: number | string;

  image?: string | null;
  primary_image_url?: string | null;
  primaryImageUrl?: string | null;
  images?: string[];

  // variant keys ที่อาจเจอ
  variant_id?: number;
  variantId?: number;
  v_id?: number;
  default_variant_id?: number;
  defaultVariantId?: number;
  first_variant_id?: number;

  stock?: number | null;
  stock_qty?: number | null;

  swatches?: string[];
  badges?: string[];
};

type NormalizedProduct = {
  id: number | string;
  name: string;
  price: number;
  image?: string | null;
  swatches?: string[];
  badges?: string[];
};

function normalize(p: ProductLike): NormalizedProduct {
  const id = (p.id ?? p.p_id) as number | string;
  const name = (p.name ?? p.pname ?? "").toString();
  const rawPrice = (p.price ?? p.base_price ?? 0) as number | string;
  const price =
    typeof rawPrice === "string" ? Number(rawPrice) : Number(rawPrice || 0);

  const image =
    p.primary_image_url ??
    p.primaryImageUrl ??
    p.image ??
    (Array.isArray(p.images) && p.images.length ? p.images[0] : undefined) ??
    null;

  return {
    id,
    name,
    price: Number.isFinite(price) ? price : 0,
    image,
    swatches: p.swatches || [],
    badges: p.badges || [],
  };
}

const RETURN_KEY = "return_to_path";

export default function ProductCard({
  product,
  showAddToCart = true,
  clickableImage = true,
  detailPath = "/product",
}: {
  product: ProductLike;
  showAddToCart?: boolean;
  clickableImage?: boolean;
  detailPath?: string;
}) {
  const p = normalize(product);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const cart = useCart();

  const [adding, setAdding] = useState(false);

  // ✅ หา "variant id" จากหลายคีย์ — ไม่ fallback เป็น p_id
  const variantId =
    Number(
      product.variant_id ??
        product.variantId ??
        product.v_id ??
        product.default_variant_id ??
        (product as any).defaultVariantId ??
        (product as any).first_variant_id
    ) || null;

  // ✅ ถ้าไม่ส่งสต็อกมา → ถือว่ามีของ
  const stockQty = (product as any).stock ?? product.stock_qty;
  const outOfStock = Number(stockQty ?? 1) <= 0;

  const swatchContainerRef = useRef<HTMLDivElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null); // ใช้หา rect สำหรับบินเข้าตะกร้า
  const swatchSize = 36;
  const swatchGap = 10;

  const scrollSwatches = (direction: "left" | "right") => {
    if (swatchContainerRef.current) {
      const scrollAmount = swatchSize + swatchGap;
      swatchContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleClickImage = () => {
    if (!clickableImage) return;
    if (p.id === undefined || p.id === null) return;
    navigate(`${detailPath}/${String(p.id)}`);
  };

  // ✅ ปุ่ม ADD TO CART (alert มินิมอล + บินเข้าตะกร้า)
  const handleAddToCart = async () => {
    if (adding || outOfStock) return;

    // ยังไม่ล็อกอิน → ชวนเข้าสู่ระบบแบบมินิมอล
    if (!currentUser) {
      const result = await minimalAlert({
        icon: "info",
        title: "Please sign in",
        text: "You need to sign in before adding items.",
        confirmText: "Sign In",
        cancelText: "Later",
        allowOutsideClick: false, // ✅ ต้องกดปุ่มเท่านั้น
        allowEscapeKey: false, // ✅
        allowEnterKey: false, // ✅
      });

      if (result.isConfirmed) {
        const target = location.pathname + location.search + location.hash;
        sessionStorage.setItem(RETURN_KEY, target);
        navigate("/login", { state: { from: { pathname: target } } });
      }
      return; // กด Later → ค้างอยู่หน้าเดิม
    }

    // ไม่มี variant id → ให้ไปเลือกที่หน้า detail
    // ไม่มี variant id → ให้ถามก่อน จะไปหน้า detail เมื่อกด "Choose" เท่านั้น
    if (!variantId) {
      const res = await selectShadeAlert();
      if (res.isConfirmed && p.id != null) {
        navigate(`${detailPath}/${String(p.id)}`);
      }
      return; // กด Later หรือปิด → อยู่หน้าเดิม
    }

    setAdding(true);

    try {
      await cart.add(variantId, 1);
    } catch (e: any) {
      setAdding(false);
      await minimalAlert({
        icon: "error",
        title: "Unable to add item",
        text: e?.message || "Something went wrong. Please try again.",
      });
      return;
    }

    try {
      const cartIcon = getCartIconEl?.();
      const imgNode = imgElRef.current;
      if (imgNode && cartIcon) {
        const rect = imgNode.getBoundingClientRect();
        flyToCart(imgNode.src, rect, cartIcon);
      }
      cart.open?.();
    } catch {}

    setAdding(false);
    minimalToast("Added to cart");
  };

  return (
    <article className="product-card">
      <div
        className={`product-image-wrap ${clickableImage ? "is-clickable" : ""}`}
        onClick={handleClickImage}
        role={clickableImage ? "button" : undefined}
        tabIndex={clickableImage ? 0 : -1}
        onKeyDown={(e) => {
          if (!clickableImage) return;
          if (e.key === "Enter" || e.key === " ") handleClickImage();
        }}
        aria-label={clickableImage ? `Open ${p.name}` : undefined}
      >
        {p.image ? (
          <img
            ref={imgElRef}
            className="product-image"
            src={p.image}
            alt={p.name}
          />
        ) : (
          <div
            className="product-image product-image--ph"
            aria-label="no image"
          >
            <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden>
              <path
                d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path
                d="M3 19l6-7 5 5 3-3 4 5H3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle cx="9" cy="8" r="1.6" fill="currentColor" />
            </svg>
          </div>
        )}

        {!!p.badges?.length && (
          <div className="badges">
            {p.badges.map((b) => (
              <span key={b} className="badge">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {!!p.swatches?.length && (
        <div className="swatches-row">
          <button
            className="swatch-arrow"
            onClick={() => scrollSwatches("left")}
            aria-label="Scroll left"
            type="button"
          >
            ‹
          </button>
          <div className="swatches-viewport">
            <div className="swatches" ref={swatchContainerRef}>
              {p.swatches.map((s, i) => {
                const isColor = s.startsWith("#") || s.startsWith("rgb");
                return (
                  <button
                    key={i}
                    className="swatch"
                    style={{
                      background: isColor ? s : undefined,
                      backgroundImage: isColor ? undefined : `url(${s})`,
                      backgroundSize: isColor ? undefined : "cover",
                      backgroundPosition: isColor ? undefined : "center",
                    }}
                    aria-label={`Shade ${i + 1}`}
                    type="button"
                  />
                );
              })}
            </div>
          </div>
          <button
            className="swatch-arrow"
            onClick={() => scrollSwatches("right")}
            aria-label="Scroll right"
            type="button"
          >
            ›
          </button>
        </div>
      )}

      <div className="product-meta">
  {/* 🔗 ชื่อสินค้า คลิกได้ */}
  <h3
    className="product-title clickable"
    onClick={() => navigate(`${detailPath}/${String(p.id)}`)}
  >
    {p.name}
  </h3>

  <div className="product-cta">
    <div
      className="product-price clickable"
      onClick={() => navigate(`${detailPath}/${String(p.id)}`)}
    >
      {Number.isFinite(p.price) ? `$${p.price.toFixed(2)}` : `$0.00`}
    </div>

    {showAddToCart ? (
      <button
        className={`add-to-cart ${outOfStock ? "outlined" : ""}`}
        onClick={handleAddToCart}
        type="button"
        disabled={outOfStock || adding}
        aria-busy={adding}
      >
        {outOfStock
          ? "OUT OF STOCK"
          : adding
          ? "ADDING..."
          : "ADD TO CART"}
      </button>
    ) : (
      <button className="add-to-cart outlined" disabled type="button">
        OUT OF STOCK
      </button>
    )}
  </div>
</div>

    </article>
  );
}
