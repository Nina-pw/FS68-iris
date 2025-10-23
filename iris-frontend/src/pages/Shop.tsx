import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import "./Shop.css";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { minimalAlert, selectShadeAlert, minimalToast } from "../utils/alerts";
import { getCartIconEl, flyToCart } from "../utils/flyToCart";

/* ---------- Types ---------- */
export type SimpleProduct = {
  id: number;
  name: string;
  price: number;
  img?: string | null;
  stock?: number;
};

type ApiProduct =
  | {
      id?: number;
      p_id?: number;
      pname?: string;
      name?: string;
      base_price?: number | string;
      price?: number | string;
      primary_image_url?: string | null;
      images?: string[] | null;
      img?: string | null;
      stock?: number;
    }
  | Record<string, unknown>;

type SortKey = "default" | "priceAsc" | "priceDesc" | "newest" | "bestsellers";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

/* ---------- Helpers ---------- */
function toSimple(p: ApiProduct): SimpleProduct | null {
  const id = Number((p as any).id ?? (p as any).p_id);
  const name = String((p as any).pname ?? (p as any).name ?? "");
  const priceRaw = (p as any).base_price ?? (p as any).price ?? 0;
  const price = Number(priceRaw);
  const img =
    (p as any).primary_image_url ??
    (p as any).img ??
    (Array.isArray((p as any).images) ? (p as any).images[0] : undefined);
  const stock = Number((p as any).stock ?? 1);
  if (!Number.isFinite(id) || !name) return null;
  return { id, name, price: Number.isFinite(price) ? price : 0, img, stock };
}

function getPageNumbers(current: number, total: number, maxPages = 5) {
  const pages: (number | "dot")[] = [];
  if (total <= maxPages) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, "dot", total);
    } else if (current >= total - 2) {
      pages.push(1, "dot", total - 2, total - 1, total);
    } else {
      pages.push(1, "dot", current - 1, current, current + 1, "dot", total);
    }
  }
  return pages;
}

async function fetchAll(signal?: AbortSignal) {
  const urls = [`${API_BASE}/api/products`, `${API_BASE}/api/shop/products`];
  for (const u of urls) {
    try {
      const res = await fetch(u, { signal, credentials: "include" });
      if (!res.ok) continue;
      const data = await res.json();
      const list: ApiProduct[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.items)
        ? (data as any).items
        : [];
      const mapped = list.map(toSimple).filter(Boolean) as SimpleProduct[];
      if (mapped.length) return mapped;
    } catch {
      // ignore and try next URL
    }
  }
  return [] as SimpleProduct[];
}

/* ---------- Components ---------- */
function ProductCard({ p }: { p: SimpleProduct }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const cart = useCart();

  const [adding, setAdding] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const outOfStock = p.stock === 0;
  const RETURN_KEY = "return_to_path";

  // ถ้า list view ไม่มี variant id เราจะพยายามเดาจากหลายคีย์เผื่อในอนาคตส่งมา
  const variantId =
    Number(
      (p as any).variant_id ??
      (p as any).default_variant_id ??
      (p as any).first_variant_id ??
      (p as any).v_id
    ) || null;

  const gotoDetail = () => navigate(`/product/${p.id}`);

  const onAddToCart = async () => {
    if (adding || outOfStock) return;

    // ยังไม่ได้ล็อกอิน → ถามก่อน (เหมือนการ์ดหลัก)
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

    // ไม่มี variant id จาก list → ให้เลือกเฉดก่อน (เหมือนการ์ดหลัก)
    if (!variantId) {
      const res = await selectShadeAlert();
      if (res.isConfirmed) gotoDetail();
      return;
    }

    // มี variant id แล้ว → add จริง
    try {
      setAdding(true);
      await cart.add(variantId, 1);

      // บินเข้าตะกร้าแบบเดียวกัน
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
        {p.img ? (
          <img ref={imgRef} src={p.img} alt={p.name} />
        ) : (
          <div className="placeholder" />
        )}
      </div>

      <div className="product-info">
        <div className="product-name" onClick={gotoDetail} role="button" tabIndex={0}
             onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && gotoDetail()}>
          {p.name}
        </div>
        <div className="product-price" onClick={gotoDetail} role="button" tabIndex={0}
             onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && gotoDetail()}>
          ${Number.isFinite(p.price) ? p.price.toFixed(2) : "0.00"}
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
export default function Shop() {
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerRow = 3;
  const rowsPerPage = 5;
  const itemsPerPage = itemsPerRow * rowsPerPage;

  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("search") ?? "";
  const initialSort = (searchParams.get("sort") as SortKey) ?? "default";
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);
  const navigate = useNavigate();

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      const list = await fetchAll(ctrl.signal);
      setProducts(list);
      setLoading(false);
    })();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const q = searchParams.get("search") ?? "";
    setQuery(q);
    setCurrentPage(1);
  }, [searchParams]);

  // ✅ อัปเดต URL ให้มี ?search= และ ?sort= ตามค่าปัจจุบัน
  useEffect(() => {
    const params = new URLSearchParams();

    if (query.trim()) params.set("search", query.trim());
    if (sort !== "default") params.set("sort", sort);

    navigate(`/shop?${params.toString()}`, { replace: true });
  }, [query, sort, navigate]);

  /* ----- Filter & Sort ----- */
  const filtered = useMemo(() => {
    let list = products.slice().sort((a, b) => b.id - a.id);

    if (query) {
      const qWords = query.toLowerCase().split(" ").filter(Boolean);

      list = list.filter((p) => {
        const nameWords = p.name.toLowerCase().split(" ").filter(Boolean);

        // แค่ query word ตัวใดตรงคำใดในชื่อสินค้าก็ถือว่า match
        return qWords.some((qw) =>
          nameWords.some((nw) => nw.startsWith(qw) || nw.includes(qw))
        );
      });
    }

    switch (sort) {
      case "priceAsc":
        list = list.slice().sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        list = list.slice().sort((a, b) => b.price - a.price);
        break;
      case "newest":
        list = list.slice().sort((a, b) => b.id - a.id);
        break;
      case "bestsellers":
        list = list; // mock
        break;
    }

    return list;
  }, [products, query, sort]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end); // slice ตาม currentPage เดิม
  }, [filtered, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sort]);

  useEffect(() => {
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages); // ปรับให้ไม่เกิน totalPages
    }
  }, [filtered.length, itemsPerPage]); // currentPage ไม่อยู่ใน dependency

  const display = loading
    ? Array.from({ length: 6 }).map((_, i) => ({ id: i, name: "", price: 0 }))
    : filtered;

  return (
    <div className="shop-container">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="chips">
          <button
            className={`chip ${sort === "bestsellers" ? "is-active" : ""}`}
            onClick={() => setSort("bestsellers")}
          >
            Bestsellers
          </button>
          <button
            className={`chip ${sort === "newest" ? "is-active" : ""}`}
            onClick={() => setSort("newest")}
          >
            Newest
          </button>
          <button
            className={`chip ${sort === "priceAsc" ? "is-active" : ""}`}
            onClick={() => setSort("priceAsc")}
          >
            Lowest Price
          </button>
          <button
            className={`chip ${sort === "priceDesc" ? "is-active" : ""}`}
            onClick={() => setSort("priceDesc")}
          >
            Highest Price
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {paginatedProducts.length ? (
          paginatedProducts.map((p) => <ProductCard key={p.id} p={p} />)
        ) : (
          <p className="no-products">No products found</p>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          &#60;
        </button>
        {getPageNumbers(
          currentPage,
          Math.ceil(filtered.length / itemsPerPage)
        ).map((p, i) =>
          p === "dot" ? (
            <span key={i} className="dot">
              ...
            </span>
          ) : (
            <button
              key={i}
              className={p === currentPage ? "active" : ""}
              onClick={() => setCurrentPage(p as number)}
            >
              {p}
            </button>
          )
        )}
        <button
          disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          &#62;
        </button>
      </div>
    </div>
  );
}
