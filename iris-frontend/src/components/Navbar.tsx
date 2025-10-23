// src/components/Navbar.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaHeart, FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
const RETURN_KEY = "return_to_path";
import "./Navbar.css";
import { minimalAlert } from "../utils/alerts";

export default function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth();
  const cart = useCart();
  const totalQty = Number(cart?.cart?.summary?.total_qty ?? 0);

  const location = useLocation();
  const navigate = useNavigate();

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const catsRef = useRef<HTMLDivElement | null>(null);
  const [searchText, setSearchText] = useState("");

  const shopPath = useMemo(() => {
    if (!currentUser) return "/shop";
    return isAdmin ? "/admin" : "/shop";
  }, [currentUser, isAdmin]);

  const homePath = "/home";
  const cartCtx = useCart();

  // ---------- NEW: helper เช็คว่า path ปัจจุบันอยู่ใน “กลุ่มหน้า” ไหน ----------
  const isIn = (...prefixes: string[]) =>
    prefixes.some((p) => location.pathname.startsWith(p));

  // active ของแต่ละเมนู
  const shopActive = isIn("/shop", "/product");
  const categoriesActive = isIn("/categories");
  const aboutActive = isIn("/aboutus");

  // ปิดเมนู account เวลา click ข้างนอก
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (catsRef.current && !catsRef.current.contains(target)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ✅ เมื่อพิมพ์ในช่อง search ให้เปลี่ยนหน้าแบบ real-time
  useEffect(() => {
    const trimmed = searchQuery.trim();

    // 🔹 ถ้าช่องว่าง → กลับไปหน้า /shop ปกติ และลบ query ออก
    if (trimmed === "") {
      if (location.pathname.startsWith("/shop")) {
        navigate("/shop", { replace: true });
      }
      return;
    }

    // 🔹 ถ้ามีข้อความ → อัปเดต query ปกติ
    if (location.pathname.startsWith("/shop")) {
      navigate(`/shop?search=${encodeURIComponent(trimmed)}`, {
        replace: true,
      });
    } else {
      navigate(`/shop?search=${encodeURIComponent(trimmed)}`);
    }
  }, [searchQuery, navigate, location.pathname]);

  // ✅ Enter → ค้นหา และ blur (ให้ cursor หาย)
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    searchInputRef.current?.blur(); // blur cursor
  };
  useEffect(() => {
    setMenuOpen(false);
    setCategoriesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    setSearchText(sp.get("q") ?? "");
  }, [location.search]);

  const setQueryParam = (q: string, replace = false) => {
    const sp = new URLSearchParams(location.search);
    if (q.trim()) sp.set("q", q.trim());
    else sp.delete("q");
    navigate(`${location.pathname}?${sp.toString()}`, { replace });
  };

  const initials = (currentUser?.name || currentUser?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ---------- วางเพิ่มเหนือ return() ----------
  const onCartClick = (e?: React.MouseEvent) => {
    e?.preventDefault?.();

    if (!currentUser) {
      // เหมือนสไตล์ที่ใช้กับ Add to cart
      (async () => {
        const res = await minimalAlert({
          icon: "info",
          title: "Please sign in",
          text: "You need to sign in before opening your cart.",
          confirmText: "Sign In",
          cancelText: "Later",
          // ต้องกดปุ่มเท่านั้นถึงจะปิด เหมือน ProductCard
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        });
        if (res.isConfirmed) {
          sessionStorage.setItem(RETURN_KEY, "/cart");
          navigate("/login", { state: { from: { pathname: "/cart" } } });
        }
      })();
      return;
    }

    // ล็อกอินแล้ว → เข้า /cart ได้เลย
    navigate("/cart");
  };

  return (
    <nav className="navbar">
      {/* LEFT */}
      <div className="navbar-left">
        <NavLink
          to={shopPath}
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          Shop
        </NavLink>

        <div
          className="dropdown"
          onMouseEnter={() => setCategoriesOpen(true)}
          onMouseLeave={() => setCategoriesOpen(false)}
        >
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              "dropbtn" + (isActive ? " active-link" : "")
            }
            onClick={(e) => {
              e.preventDefault(); // ป้องกันไม่ให้ NavLink ทำงานปกติ
              navigate("/categories/face"); // ✅ พาไปหน้า face โดยตรง
            }}
          >
            Categories
          </NavLink>

          <div
            className={`dropdown-content dropdown-grid ${
              categoriesOpen ? "show" : ""
            }`}
          >
            <NavLink to="/categories/face" className="dropdown-item">
              <img src="/assets/face.png" alt="face" />
              <span>face</span>
            </NavLink>
            <NavLink to="/categories/eyes" className="dropdown-item">
              <img src="/assets/eyes.png" alt="eyes" />
              <span>eyes</span>
            </NavLink>
            <NavLink to="/categories/lips" className="dropdown-item">
              <img src="/assets/lips.png" alt="lips" />
              <span>lips</span>
            </NavLink>
            <NavLink to="/categories/cheeks" className="dropdown-item">
              <img src="/assets/cheeks.png" alt="cheeks" />
              <span>cheeks</span>
            </NavLink>
            <NavLink to="/categories/body" className="dropdown-item">
              <img src="/assets/body.png" alt="body" />
              <span>body</span>
            </NavLink>
            <NavLink to="/categories/tools" className="dropdown-item">
              <img src="/assets/tools.png" alt="tools" />
              <span>tools</span>
            </NavLink>
          </div>
        </div>

        <NavLink
          to="/aboutus"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          About Us
        </NavLink>
      </div>

      {/* CENTER */}
      <div className="navbar-center">
        <button
          className="logo-btn"
          onClick={() => {
            setSearchQuery(""); // ✅ ล้างช่อง search
            navigate(homePath, { replace: true }); // ✅ ไปหน้า home
            window.location.reload(); // ✅ รีเฟรชหน้าใหม่
          }}
        >
          <img src="/assets/pic2.png" alt="Logo" className="navbar-logo" />
        </button>
      </div>
      {/* RIGHT */}
      <div className="navbar-right">
        {/* ✅ SEARCH */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="search-icon" onClick={handleSearch} />
        </form>
        {/* <div className="navbar-search">
          <input type="text" placeholder="Search..." aria-label="Search" />
          <FaSearch className="search-icon" />
        </div>
          */}

        {!currentUser ? (
          <button
            type="button"
            aria-label="Cart"
            className="btn-reset nav-cart-link"
            id="cart-icon"
            onClick={onCartClick}
          >
            <FaShoppingCart className="navbar-icon" />
            {totalQty > 0 && <span className="cart-badge">{totalQty}</span>}
          </button>
        ) : (
          <NavLink
            to="/cart"
            aria-label="Cart"
            className="nav-cart-link"
            id="cart-icon"
          >
            <FaShoppingCart className="navbar-icon" />
            {totalQty > 0 && <span className="cart-badge">{totalQty}</span>}
          </NavLink>
        )}

        {/* Wishlist (เปลี่ยนปลายทางได้) */}
        {/* <NavLink to={shopPath} aria-label="Wishlist">
          <FaHeart className="navbar-icon" />
        </NavLink> */}

        {/* ACCOUNT */}
        {!currentUser ? (
          <Link
            to="/login"
            state={{ background: location, fromNavIcon: true }}
            aria-label="Login"
          >
            <FaUser className="navbar-icon" />
          </Link>
        ) : (
          <div className="nav-account" ref={menuRef}>
            <button
              type="button"
              className="btn-reset navbar-icon"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={`${currentUser.name} (${currentUser.email})`}
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Profile"
                  className="nav-avatar"
                />
              ) : (
                <div className="nav-avatar-fallback">{initials}</div>
              )}
            </button>

            {menuOpen && (
              <div className="nav-menu" role="menu">
                <div className="nav-menu__header">
                  <div className="nav-menu__name">{currentUser.name}</div>
                  <div className="nav-menu__email">{currentUser.email}</div>
                </div>

                {isAdmin ? (
                  <button
                    className="nav-menu__item"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/admin");
                    }}
                  >
                    Admin dashboard
                  </button>
                ) : (
                  <button
                    className="nav-menu__item"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate("/my-orders");
  //                     const lastId = sessionStorage.getItem("last_order_id");
  //  navigate(lastId ? `/my-orders/${lastId}` : "/my-orders");
                    }}
                  >
                    My Orders
                  </button>
                )}

                <button
                  className="nav-menu__item"
                  onClick={() => {
                    setMenuOpen(false);
                    cartCtx?.clearLocal?.();
                    cartCtx?.close?.();
                    navigate("/auth/logout");
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
