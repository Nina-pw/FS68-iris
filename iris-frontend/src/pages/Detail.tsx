// src/pages/Detail.tsx
import { useEffect, useMemo, useState, useLayoutEffect } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import "./Detail.css";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import { flyToCart, getCartIconEl } from "../utils/flyToCart";
// import { toast } from "../utils/toast";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

// (อยู่บนสุดของไฟล์ ใต้ import)
const fmtTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

/* ---------- Types ---------- */
type ProductVariant = {
  id: number;
  p_id: number;
  sku: string;
  shade_name: string | null;
  shade_code: string | null;
  price: number;
  stock_qty: number;
  is_active: boolean;
  image_url?: string | null;
};

type Product = {
  p_id: number;
  pname: string;
  description: string | null;
  base_price: number;
  pc_id: number;
  primary_image_url: string | null;
  images?: string[];
  variants?: ProductVariant[];
};

type RelatedCard = {
  href: string;
  pname: string;
  primary_image_url: string | null;
  base_price: number;
};

/* ---------- Normalizers ---------- */
function num(n: any, fb = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fb;
}
function toVariant(a: any): ProductVariant {
  return {
    id: num(a.id ?? a.ID),
    p_id: num(a.pId ?? a.p_id),
    sku: String(a.sku ?? ""),
    shade_name: a.shadeName ?? a.shade_name ?? null,
    shade_code: a.shadeCode ?? a.shade_code ?? null,
    price: num(a.price),
    stock_qty: num(a.stockQty ?? a.stock_qty),
    is_active: Boolean(a.isActive ?? a.is_active ?? true),
    image_url: a.imageUrl ?? a.image_url ?? null,
  };
}
function toProduct(a: any): Product {
  const images: string[] = Array.isArray(a.images)
    ? a.images
    : Array.isArray(a.Images)
    ? a.Images
    : [];
  return {
    p_id: num(a.pId ?? a.p_id),
    pname: String(a.pname ?? a.name ?? ""),
    description: a.description ?? null,
    base_price: num(a.basePrice ?? a.base_price),
    pc_id: num(a.pcId ?? a.pc_id),
    primary_image_url: a.primaryImageUrl ?? a.primary_image_url ?? null,
    images,
    variants: Array.isArray(a.variants) ? a.variants.map(toVariant) : [],
  };
}

/* ---------- Utils ---------- */
function normUrl(u?: string | null) {
  try {
    if (!u) return "";
    const url = new URL(u);
    return `${url.origin}${url.pathname}`;
  } catch {
    return (u || "").trim();
  }
}

/* ---------- Page ---------- */
export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const cartCtx = useCart();
  const { add, open } = cartCtx;

  // states
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [showVariantImg, setShowVariantImg] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const RETURN_KEY = "return_to_path";
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<
    number | undefined
  >(undefined);
  const [hasChosen, setHasChosen] = useState(false);

  // อนุพันธ์จาก product
  const activeVariants = useMemo(
    () => (product?.variants ?? []).filter((v) => v.is_active),
    [product]
  );

  const selectedVariant = useMemo(
    () => activeVariants.find((v) => v.id === selectedVariantId),
    [activeVariants, selectedVariantId]
  );

  // แกลเลอรี
  const gallery: string[] = useMemo(() => {
    if (showVariantImg && selectedVariant?.image_url) {
      return [selectedVariant.image_url];
    }
    const ordered: (string | null | undefined)[] = [
      product?.primary_image_url,
      ...(product?.images ?? []),
    ];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const src of ordered) {
      const s = (src || "").trim();
      if (!s) continue;
      const key = normUrl(s);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
    }
    return out;
  }, [
    showVariantImg,
    selectedVariant?.image_url,
    product?.primary_image_url,
    product?.images,
  ]);

  // จำนวนสินค้าที่ variant นี้มีอยู่ในตะกร้าแล้ว
  const inCartQty = useMemo(
    () => getVariantQtyInCart(cartCtx, selectedVariant?.id),
    [cartCtx.cart, selectedVariant?.id]
  );

  // จำนวนคงเหลือที่ “ยังเพิ่มได้” (สต็อก - ที่อยู่ในตะกร้าแล้ว)
  const stockLeft = useMemo(() => {
    return selectedVariant
      ? Math.max(0, selectedVariant.stock_qty - inCartQty)
      : 0;
  }, [selectedVariant, inCartQty]);

  // ค่าเริ่มต้น: shade แรกที่มี stock
  // useEffect(() => {
  //   const firstAvailable = activeVariants.find((v) => v.stock_qty > 0)?.id;
  //   setSelectedVariantId(firstAvailable);
  // }, [activeVariants]);

  // เปลี่ยนสินค้า → รีเซ็ต
  useEffect(() => {
    setShowVariantImg(false);
    setActiveIndex(0);
    setQuantity(1);
    setSelectedVariantId(undefined);
    setHasChosen(false);
  }, [id]);
  // รีเซ็ตรูปเมื่อเปลี่ยนโหมดหรือ shade
  useEffect(() => setActiveIndex(0), [showVariantImg, selectedVariantId]);

useLayoutEffect(() => {
  document.getElementById("app-shell")?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}, []);

  // โหลดสินค้า + related
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        const r = await fetch(`${API_BASE}/api/products/${id}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!r.ok) throw new Error(String(r.status));
        const p = toProduct(await r.json());
        if (!mounted) return;
        setProduct(p);

        const rr = await fetch(
          `${API_BASE}/api/products/${id}/related?limit=8`,
          {
            credentials: "include",
            cache: "no-store",
          }
        ).catch(() => null);

        if (!mounted) return;
        if (rr?.ok) {
          const list = await rr.json();
          const mapped: Product[] = (Array.isArray(list) ? list : []).map(
            toProduct
          );
          setRelated(
            mapped
              .filter((x) => x.p_id !== Number(id))
              .slice(0, 8)
              .map((x) => ({
                href: `/product/${x.p_id}`,
                pname: x.pname,
                primary_image_url: x.primary_image_url ?? x.images?.[0] ?? null,
                base_price: x.base_price,
              }))
          );
        } else {
          setRelated([]);
        }
      } catch {
        if (mounted) {
          setProduct(null);
          setRelated([]);
        }
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // เลือก shade (คลิกซ้ำ = ยกเลิก)
  function onSelectShade(v: ProductVariant) {
    // ถ้าคลิกตัวเดิม ให้ยกเลิกการเลือก
    if (v.id === selectedVariantId && hasChosen) {
      setSelectedVariantId(undefined);
      setHasChosen(false);
      setShowVariantImg(false);
      return;
    }

    // เลือกตัวใหม่
    setSelectedVariantId(v.id);
    setHasChosen(true);
    setShowVariantImg(true);
  }

  function getVariantQtyInCart(cartObj: any, variantId?: number) {
    if (!variantId) return 0;
    const items: any[] =
      (cartObj?.cart?.items as any[]) ?? (cartObj?.items as any[]) ?? [];

    let total = 0;
    for (const it of items) {
      const vid = Number(
        it.variant_id ?? it.v_id ?? it.variantId ?? it.id ?? it.vid
      );
      const q = Number(
        it.qty ?? it.quantity ?? it.qty_ordered ?? it.amount ?? 0
      );
      if (vid === variantId && Number.isFinite(q)) total += q;
    }
    return total;
  }

  if (loading) {
    return (
      <main className="pt-90">
        <section className="product-single container">
          <p>Loading…</p>
        </section>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pt-90">
        <section className="product-single container">
          <p>Product not found.</p>
        </section>
      </main>
    );
  }

  const displayPrice = selectedVariant?.price ?? product.base_price;
  const maxQty = selectedVariant ? selectedVariant.stock_qty : 99;

  const onAddToCart = async () => {
    // 1) Guards
    if (activeVariants.length > 0 && !hasChosen) return;

    if (!selectedVariant?.id) {
      await Swal.fire({
        icon: "warning",
        title: "Please select a product shade first.",
        confirmButtonText: "OK",
      });
      return;
    }

    // ต้องล็อกอินก่อน
    if (!currentUser) {
      const res = await Swal.fire({
        icon: "info",
        title: "Please sign in",
        text: "You need to sign in before adding items to your cart.",
        confirmButtonText: "Sign In",
        showCancelButton: true,
        cancelButtonText: "Later",
        allowOutsideClick: false,
        allowEscapeKey: false,
        reverseButtons: false, // Later ซ้าย / Sign In ขวา
      });

      if (res.isConfirmed) {
        const target = location.pathname + location.search + location.hash;
        sessionStorage.setItem(RETURN_KEY, target);
        navigate("/login", { state: { from: { pathname: target } } });
      }
      return;
    }

    // เต็มสต็อกเมื่อรวมของในตะกร้า
    if (stockLeft <= 0) {
      await Swal.fire({
        icon: "info",
        title: "This shade is sold out in your cart.",
        text: "You have already added the maximum available quantity.",
        confirmButtonText: "OK",
      });
      return;
    }

    // ขอเกินที่เหลือเพิ่มได้
    if (quantity > stockLeft) {
      await Swal.fire({
        icon: "info",
        title: "Limited stock available",
        text: `You can add up to ${stockLeft} more item(s) for this shade.`,
        confirmButtonText: "OK",
      });
      setQuantity(stockLeft);
      return;
    }

    setAdding(true);

    // 2) เพิ่มลงตะกร้า
    try {
      await add(selectedVariant.id, quantity);
    } catch (e: any) {
      setAdding(false);
      await Swal.fire({
        icon: "error",
        title: "Unable to add item",
        text: e?.message || "Something went wrong. Please try again.",
        confirmButtonText: "OK",
      });
      return;
    }

    // 3) เปิดตะกร้า + เอฟเฟกต์บิน (กันพัง)
    try {
      open?.();
    } catch {
      /* no-op */
    }

    // ทำเอฟเฟกต์บินเข้าตะกร้า
    try {
      const imgSrc =
        (showVariantImg && selectedVariant?.image_url) ||
        gallery[activeIndex] ||
        product.primary_image_url ||
        product.images?.[0] ||
        "";

      // ใช้รูปใหญ่ปัจจุบันเป็นจุดเริ่ม
      const stageImg =
        document.querySelector<HTMLImageElement>(
          ".ps-gallery__stage .ps-gallery__image"
        ) || document.querySelector<HTMLImageElement>(".ps-gallery__image");

      // fallback: ปุ่ม Add to Cart
      const addBtn =
        document.querySelector<HTMLButtonElement>(".btn-addtocart");
      const cartEl = getCartIconEl();

      const fromRect =
        stageImg?.getBoundingClientRect() || addBtn?.getBoundingClientRect();

      if (imgSrc && fromRect && cartEl) {
        // ถ้า flyToCart รองรับ duration จะใช้ตามนี้
        flyToCart(imgSrc, fromRect, cartEl, { duration: 1200 });
      }
    } catch {
      /* no-op */
    }

    // toast เล็ก ๆ
    // try {
    //   toast.fire({ html: "Item added to cart" });
    // } catch { /* no-op */ }

    setAdding(false);
  };

  return (
    <main className="pt-90">
      <section className="product-single container">
        <div className="row">
          {/* Left: Gallery */}
          <div className="col-lg-7">
            <div className="ps-gallery">
              <div className="ps-gallery__stage">
                {gallery[activeIndex] ? (
                  <img
                    src={gallery[activeIndex]}
                    alt={product.pname}
                    className="ps-gallery__image"
                  />
                ) : (
                  <div
                    className="ps-gallery__placeholder"
                    aria-label="no image"
                  />
                )}

                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="ps-gallery__nav ps-gallery__nav--prev"
                      onClick={() =>
                        setActiveIndex((i) =>
                          i === 0 ? gallery.length - 1 : i - 1
                        )
                      }
                      aria-label="Previous image"
                    >
                      <span className="nav-icon">‹</span>
                    </button>
                    <button
                      type="button"
                      className="ps-gallery__nav ps-gallery__nav--next"
                      onClick={() =>
                        setActiveIndex((i) =>
                          i === gallery.length - 1 ? 0 : i + 1
                        )
                      }
                      aria-label="Next image"
                    >
                      <span className="nav-icon">›</span>
                    </button>
                  </>
                )}
              </div>

              {gallery.length > 0 && (
                <div className="ps-gallery__thumbs" role="tablist">
                  {gallery.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      className={`ps-thumb${
                        i === activeIndex ? " ps-thumb--active" : ""
                      }`}
                      onClick={() => setActiveIndex(i)}
                      aria-label={`Thumbnail ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt={`${product.pname} thumbnail ${i + 1}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div className="col-lg-5">
            <h1 className="product-single__name">{product.pname}</h1>

            {/* บรรทัดสไตล์ Rare Beauty: No. + ชื่อเฉด ถ้าเลือกแล้ว */}
            {selectedVariant?.shade_name ? (
              <div className="rb-subtitle">
                No.{" "}
                <span className="rb-shade-name">
                  {selectedVariant.shade_name}
                </span>
              </div>
            ) : null}

            <div className="product-single__price">
              <span className="current-price">
                {fmtTHB(Number(displayPrice ?? 0))}
              </span>

              {/* ข้อมูลเสริม (SKU/Stock) — เก็บไว้เป็นตัวเล็ก ๆ ด้านขวา */}
              {selectedVariant && (
                <span className="ms-2 text-secondary small">
                  Stock: {selectedVariant.stock_qty}
                </span>
              )}
            </div>

            {product.description && (
              <div className="product-single__short-desc">
                <p>{product.description}</p>
              </div>
            )}

            {/* Variants */}
            {/* Variants */}
            {activeVariants.length > 0 && (
              <div className="mb-3">
                <div className="shade-header">
                  <span className="shade-header__title">SHADE</span>
                  {selectedVariant?.shade_name ? (
                    <span className="shade-header__current">
                      {selectedVariant.shade_name}
                    </span>
                  ) : null}
                </div>

                <div className="shade-group">
                  {activeVariants.map((v) => {
                    const selected =
                      hasChosen && v.id === selectedVariantId && showVariantImg;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={`shade ${selected ? "is-selected" : ""}`}
                        onClick={() => onSelectShade(v)}
                        disabled={v.stock_qty <= 0}
                        title={`${v.shade_name ?? ""} (${v.sku})`}
                      >
                        <span
                          className="shade__dot"
                          style={{ background: v.shade_code || "#ccc" }}
                        />
                        {/* ถ้าต้องการให้เป็น “จุดอย่างเดียว” ให้ลบ span ด้านล่างนี้ทิ้ง */}
                        {/* <span className="shade__label">
                          {v.shade_name ?? "—"}
                        </span> */}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add to cart */}
            <div className="product-single__addtocart">
              <div className="qty-control">
                <button
                  type="button"
                  className="qty-control__btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease"
                >
                  −
                </button>
                <input
                  type="number"
                  className="qty-control__number"
                  min={1}
                  max={maxQty}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(() => {
                      const v = Number(e.target.value) || 1;
                      return Math.max(1, Math.min(stockLeft || 1, v));
                    })
                  }
                />
                <button
                  type="button"
                  className="qty-control__btn"
                  onClick={() =>
                    setQuantity((q) => Math.min(stockLeft || 1, q + 1))
                  }
                  aria-label="Increase"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={onAddToCart}
                className={`btn btn-primary btn-addtocart ${
                  adding ? "disabled" : ""
                }`}
                disabled={
                  adding ||
                  // ถ้ามี variant ต้องเลือกก่อนถึงจะกดได้
                  (activeVariants.length > 0 && !selectedVariant) ||
                  // ถ้าเลือกแล้วแต่ stock หมดก็ห้ามกด
                  stockLeft <= 0
                }
              >
                {adding
                  ? "Adding..."
                  : !selectedVariant && activeVariants.length > 0
                  ? "Select Shade"
                  : selectedVariant && stockLeft <= 0
                  ? "Out of Stock"
                  : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="products-carousel container mt-5">
            <h2 className="text-uppercase">Related Products</h2>
            <div className="row g-3">
              {related.map((p) => (
                <div key={p.href + p.pname} className="col-6 col-md-4 col-lg-3">
                  <div className="product-card product-card_style3">
                    <div className="pc__img-wrapper">
                      <Link to={p.href}>
                        <img
                          loading="lazy"
                          src={p.primary_image_url || "/assets/placeholder.png"}
                          width={258}
                          height={313}
                          alt={p.pname}
                          className="pc__img"
                        />
                      </Link>
                    </div>
                    <div className="pc__info position-relative">
                      <h6 className="pc__title">
                        <Link to={p.href}>{p.pname}</Link>
                      </h6>
                      <div className="product-card__price d-flex align-items-center">
                        <span className="money price text-secondary">
                          {fmtTHB(Number(p.base_price ?? 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
