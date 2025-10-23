// src/pages/Categories.tsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { minimalAlert, minimalToast, selectShadeAlert } from "../utils/alerts";
import { flyToCart, getCartIconEl } from "../utils/flyToCart";
import "./Shop.css";
import "./Categories.css";

/* ---------- Types ---------- */
type Category = {
  cId: number;
  pcname: string;
};

export type SimpleProduct = {
  id: number;
  name: string;
  price: number;
  img?: string | null;
  stock?: number;
  categoryId?: number;
  // เผื่ออนาคตมีส่ง variant id มาใน list
  variant_id?: number;
  default_variant_id?: number;
  first_variant_id?: number;
};

type ApiProduct =
  | {
      id?: number;
      p_id?: number;
      pId?: number;
      pname?: string;
      name?: string;
      base_price?: number | string;
      basePrice?: number | string;
      price?: number | string;
      primary_image_url?: string | null;
      primaryImageUrl?: string | null;
      images?: string[] | null;
      img?: string | null;
      stock?: number;
      pc_id?: number;
      pcId?: number;

      // optional variant keys
      variant_id?: number;
      default_variant_id?: number;
      first_variant_id?: number;
    }
  | Record<string, unknown>;

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const CATEGORY_PILLS = [
  { slug: "face",   label: "Face" },
  { slug: "eyes",   label: "Eyes" },
  { slug: "lips",   label: "Lips" },
  { slug: "cheeks", label: "Cheeks" },
  { slug: "body",   label: "Body" },
  { slug: "tools",  label: "Tools" },
];

/* ---------- Helpers ---------- */
function toSimple(p: ApiProduct): SimpleProduct | null {
  const id = Number((p as any).id ?? (p as any).p_id ?? (p as any).pId);
  const name = String((p as any).pname ?? (p as any).name ?? "");

  const priceRaw =
    (p as any).base_price ?? (p as any).basePrice ?? (p as any).price ?? 0;
  const price = Number(priceRaw);

  const img =
    (p as any).primary_image_url ??
    (p as any).primaryImageUrl ??
    (Array.isArray((p as any).images) ? (p as any).images[0] : undefined);

  const stock = Number((p as any).stock ?? 1);

  const categoryId =
    (p as any).pc_id != null
      ? Number((p as any).pc_id)
      : (p as any).pcId != null
      ? Number((p as any).pcId)
      : undefined;

  if (!Number.isFinite(id) || !name) return null;

  return {
    id,
    name,
    price: Number.isFinite(price) ? price : 0,
    img,
    stock,
    categoryId,
    // ดึง variant id ไว้ถ้ามี
    variant_id: (p as any).variant_id,
    default_variant_id: (p as any).default_variant_id,
    first_variant_id: (p as any).first_variant_id,
  };
}

/* ---------- Card (พร้อม Add to cart + Alert + บินเข้าตะกร้า) ---------- */
function ProductCard({ p }: { p: SimpleProduct }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const cart = useCart();

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [adding, setAdding] = useState(false);

  const outOfStock = Number(p.stock ?? 1) <= 0;
  const RETURN_KEY = "return_to_path";

  const gotoDetail = () => navigate(`/product/${p.id}`);

  // เดา variant id จากหลายคีย์ (ถ้ามี)
  const variantId =
    Number(
      (p as any).variant_id ??
        (p as any).default_variant_id ??
        (p as any).first_variant_id
    ) || null;

  const onAddToCart = async () => {
    if (adding || outOfStock) return;

    // ยังไม่ล็อกอิน -> ขอให้ Sign in ก่อน
    if (!currentUser) {
      const res = await minimalAlert({
        icon: "info",
        title: "Please sign in",
        text: "You need to sign in before adding items.",
        confirmText: "Sign In",
        cancelText: "Later",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      });
      if (res.isConfirmed) {
        const target = location.pathname + location.search + location.hash;
        sessionStorage.setItem(RETURN_KEY, target);
        navigate("/login", { state: { from: { pathname: target } } });
      }
      return;
    }

    // ไม่มี variant id ใน list -> ให้ยืนยันไปเลือกเฉดที่หน้า detail
    if (!variantId) {
      const res = await selectShadeAlert();
      if (res.isConfirmed) gotoDetail();
      return;
    }

    try {
      setAdding(true);
      await cart.add(variantId, 1);

      // บินเข้าตะกร้า
      try {
        const cartIcon = getCartIconEl?.();
        const imgNode = imgRef.current;
        if (imgNode && cartIcon) {
          const rect = imgNode.getBoundingClientRect();
          flyToCart(imgNode.src, rect, cartIcon);
        }
        cart.open?.();
      } catch {}

      minimalToast("Added to cart");
    } catch (e: any) {
      await minimalAlert({
        icon: "error",
        title: "Unable to add item",
        text: e?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className={`product-card ${outOfStock ? "is-disabled" : ""}`}>
      <div
        className={`product-img ${!outOfStock ? "is-clickable" : ""}`}
        onClick={!outOfStock ? gotoDetail : undefined}
        role={!outOfStock ? "button" : undefined}
        tabIndex={!outOfStock ? 0 : -1}
        onKeyDown={(e) => {
          if (!outOfStock && (e.key === "Enter" || e.key === " ")) gotoDetail();
        }}
      >
        {p.img ? <img ref={imgRef} src={p.img} alt={p.name} /> : <div className="placeholder" />}
      </div>

      <div className="product-info">
        <div
          className="product-name"
          onClick={gotoDetail}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && gotoDetail()}
        >
          {p.name}
        </div>
        <div
          className="product-price"
          onClick={gotoDetail}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && gotoDetail()}
        >
          ฿{Number.isFinite(p.price) ? p.price.toFixed(2) : "0.00"}
        </div>
      </div>

      <button
        className={`product-btn ${outOfStock ? "disabled" : ""}`}
        onClick={onAddToCart}
        disabled={outOfStock || adding}
        aria-busy={adding}
      >
        {outOfStock ? "OUT OF STOCK" : adding ? "ADDING..." : "ADD TO CART"}
      </button>
    </div>
  );
}

/* ---------- Page ---------- */
export default function Categories() {
  const { slug } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    setLoading(true);
    setCategory(null);
    setProducts([]);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/categories/${slug}`, {
          signal: controller.signal,
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const prods = (data?.products || [])
          .map(toSimple)
          .filter((p: SimpleProduct | null): p is SimpleProduct => Boolean(p));

        // ลบซ้ำด้วย id
        const uniqueProds = Array.from(
          new Map<number, SimpleProduct>(prods.map((p: { id: any; }) => [p.id, p])).values()
        );

        setCategory(data.category);
        setProducts(uniqueProds);
      } catch (err) {
        console.error("❌ Error loading category:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [slug]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!category) return <div className="no-products">Category not found</div>;

  return (
    <div className="categories-container">
      {/* ⬇️ แถบหมวดด้านบน */}
      <div className="toolbar">
  <div className="chips" role="tablist" aria-label="Browse categories">
    {CATEGORY_PILLS.map((c) => (
      <NavLink
        key={c.slug}
        to={`/categories/${c.slug}`}
        className={({ isActive }) => `chip${isActive ? " is-active" : ""}`}
        role="tab"
        aria-selected={slug === c.slug}
      >
        {c.label}
      </NavLink>
    ))}
  </div>
</div>

      <div className="category-section">
        {/* <h2 className="category-title">{category.pcname}</h2> */}

        {/* (ถ้าอยากมีแถบ sort แบบ Bestsellers/Newest/Lowest/Highest ให้ใส่ตรงนี้ได้) */}

        <div className="product-grid">
          {products.length > 0 ? (
            products.map((p) => <ProductCard key={p.id} p={p} />)
          ) : (
            <p className="no-products">No products in this category</p>
          )}
        </div>
      </div>
    </div>
  );
}