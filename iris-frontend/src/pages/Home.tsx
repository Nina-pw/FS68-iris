// src/pages/Home.tsx
import "./Home.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { minimalAlert, minimalToast, selectShadeAlert } from "../utils/alerts";
import { flyToCart, getCartIconEl } from "../utils/flyToCart";

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

async function fetchAll(signal?: AbortSignal, limit: number = 8) {
  const urls = [`${API_BASE}/api/shop/bestsellers`];
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
      if (!mapped.length) continue;

      // ✅ สุ่มเรียงลำดับ แล้วเลือกแค่ limit ตัว (เช่น 8 ตัว)
      const shuffled = [...mapped].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit);
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
        <div
          className="product-name"
          onClick={gotoDetail}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && gotoDetail()
          }
        >
          {p.name}
        </div>
        <div
          className="product-price"
          onClick={gotoDetail}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && gotoDetail()
          }
        >
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

// ======================= หน้า Home =======================
type Banner = {
  id: string;
  img: string;
  title?: string;
  subtitle?: string;
  btnText?: string;
  action: "route" | "scroll" | "routeWithQuery";
  route?: string;
  query?: Record<string, string>;
  scrollToId?: string;
};

export default function Home() {
  const navigate = useNavigate();

  const goToShadeDetail = () => {
    navigate("/product/1");
  };

  const banners: Banner[] = [
    {
      id: "hero-1",
      img: "/assets/pic7.png",
      title: "Shop Our Entire Collection",
      subtitle: "Discover our curated selection for the year.",
      btnText: "SHOP NOW",
      action: "route",
      route: "/shop",
    },
    {
      id: "hero-2",
      img: "/assets/pic6.jpg",
      title: "Bestsellers",
      subtitle: "Our customers' favourite picks.",
      btnText: "SHOP NOW",
      action: "scroll",
      scrollToId: "bestsellers",
    },
    {
      id: "hero-3",
      img: "/assets/pic5.png",
      title: "New Arrivals",
      subtitle: "Fresh products — just landed.",
      btnText: "SHOP NOW",
      action: "routeWithQuery",
      route: "/shop",
      query: { filter: "new" },
    },
  ];

  // HERO carousel
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const autoplayDelay = 4000;

  useEffect(() => {
    startAuto();
    return stopAuto;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAuto = () => {
    stopAuto();
    intervalRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, autoplayDelay);
  };

  const stopAuto = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const goTo = (i: number) => {
    setIndex(i % banners.length);
    startAuto();
  };

  const handleBtn = (b: Banner) => {
    if (b.action === "route" && b.route) {
      navigate(b.route);
    } else if (b.action === "routeWithQuery" && b.route) {
      const q = new URLSearchParams(b.query || {}).toString();
      navigate(`${b.route}${q ? `?${q}` : ""}`);
    } else if (b.action === "scroll" && b.scrollToId) {
      const el = document.getElementById(b.scrollToId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 🔥 Bestsellers (ดึงเหมือน Shop)
  const [bestsellers, setBestsellers] = useState<SimpleProduct[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      const all = await fetchAll(ctrl.signal); // ใช้ fetchAll เดียวกับหน้า Shop
      // ตอนนี้สุ่ม 8 ชิ้น; ถ้ามีฟิลด์ยอดขายค่อยปรับเป็นเรียงตามยอดขาย
      const shuffled = [...all].sort(() => Math.random() - 0.5);
      setBestsellers(shuffled.slice(0, 8));
    })();
    return () => ctrl.abort();
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current)
      scrollRef.current.scrollBy({ left: -420, behavior: "smooth" });
  };
  const scrollRight = () => {
    if (scrollRef.current)
      scrollRef.current.scrollBy({ left: 420, behavior: "smooth" });
  };

  return (
    <div className="home">
      {/* HERO carousel */}
      <section
        className="hero full-bleed carousel"
        onMouseEnter={stopAuto}
        onMouseLeave={startAuto}
      >
        <div
          className="carousel-track"
          ref={trackRef}
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live="polite"
        >
          {banners.map((b) => (
            <div key={b.id} className="carousel-slide">
              <img src={b.img} alt={b.title ?? "Hero"} className="hero__bg" />
              <div className="hero__overlay">
                <div className="container hero__inner">
                  {b.title && <h1 className="hero__title">{b.title}</h1>}
                  {b.subtitle && <p className="hero__subtitle">{b.subtitle}</p>}
                  {b.btnText && (
                    <button className="hero__btn" onClick={() => handleBtn(b)}>
                      {b.btnText}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* dots */}
        <div className="carousel-dots">
          {banners.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* arrows */}
        <button
          className="carousel-arrow left"
          onClick={() => {
            setIndex((i) => (i - 1 + banners.length) % banners.length);
            startAuto();
          }}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          className="carousel-arrow right"
          onClick={() => {
            setIndex((i) => (i + 1) % banners.length);
            startAuto();
          }}
          aria-label="Next slide"
        >
          ›
        </button>
      </section>

      {/* 🔥 Bestsellers section */}
      <section id="bestsellers" className="section section--bestsellers">
        <div className="container container--wide">
          <div className="bestsellers-headline">
            <h2 className="section__title">Bestsellers</h2>
            <a className="small-link" href="/shop?sort=bestseller">
              SHOP NOW
            </a>
          </div>

          <div className="bestseller-wrapper">
            <button
              className="bs-arrow left"
              onClick={scrollLeft}
              aria-label="Scroll left"
            >
              ‹
            </button>

            <div className="bestseller-scroll" ref={scrollRef}>
              {bestsellers.map((p, i) => (
                <ProductCard key={`${p.id}-${i}`} p={p} />
              ))}
            </div>

            <button
              className="bs-arrow right"
              onClick={scrollRight}
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* Banner with text + image (after Bestsellers) */}
      <section className="section banner-shade">
        <div className="container banner-shade__inner">
          <div className="banner-shade__image">
            <img src="/assets/pic8.jpg" alt="Find your shade" />
          </div>
          <div className="banner-shade__content">
            <h2 className="banner-shade__title">Find Your Perfect Shade</h2>

            <p className="banner-shade__desc">
              Discover foundation and makeup that match your unique skin tone.
              Our shade finder helps you explore and select products with
              confidence.
            </p>
            <button className="banner-shade__btn" onClick={goToShadeDetail}>
              FIND YOUR SHADE
            </button>

            {/* } */}
          </div>
        </div>
      </section>

      {/* Shop by Categories */}
      <section className="section section--categories">
        <div className="container">
          <div className="categories-headline">
            <h2 className="section__title">Shop by Categories</h2>
            <a className="small-link" href="/categories/face">
              SEE MORE
            </a>
          </div>

          <div className="categories-grid">
            {[
              { id: "face", name: "Face", img: "/assets/pic11.jpg" },
              { id: "Eyes", name: "Eyes", img: "/assets/pic9.jpg" },
              { id: "Lips", name: "Lips", img: "/assets/pic10.jpg" },
              { id: "Cheeks", name: "Cheeks", img: "/assets/pic12.jpg" },
            ].map((cat) => (
              <a
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="category-card"
              >
                <div className="hex">
                  <img src={cat.img} alt={cat.name} />
                  <span className="cat-label">{cat.name}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
