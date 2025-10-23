// src/utils/flyToCart.ts
export function flyToCart(
  imgSrc: string,
  fromRect: DOMRect,
  cartEl: HTMLElement,
  options?: { duration?: number }
) {
  if (!imgSrc || !cartEl || !fromRect) return;

  const cartRect = cartEl.getBoundingClientRect();
  const startX = fromRect.left + fromRect.width / 2;
  const startY = fromRect.top + fromRect.height / 2;
  const endX = cartRect.left + cartRect.width / 2;
  const endY = cartRect.top + cartRect.height / 2;

  const ghost = document.createElement("img");
  ghost.src = imgSrc;
  ghost.alt = "flying";
  ghost.setAttribute("aria-hidden", "true");
  ghost.className = "fly-ghost";

  // ✅ style พื้นฐานให้ขยับได้
  const dur = Math.max(200, options?.duration ?? 800);
  ghost.style.position = "fixed";
  ghost.style.left = `${startX}px`;
  ghost.style.top = `${startY}px`;
  ghost.style.transform = "translate(-50%, -50%) scale(1)";
  ghost.style.opacity = "1";
  ghost.style.width = "120px";            // ปรับได้ตามใจ
  ghost.style.height = "120px";
  ghost.style.objectFit = "cover";
  ghost.style.borderRadius = "12px";
  ghost.style.pointerEvents = "none";
  ghost.style.zIndex = "2147483647";
  ghost.style.willChange = "left, top, transform, opacity";
  ghost.style.transition = `left ${dur}ms cubic-bezier(.2,.8,.2,1),
                            top ${dur}ms cubic-bezier(.2,.8,.2,1),
                            transform ${dur}ms cubic-bezier(.2,.8,.2,1),
                            opacity ${dur}ms linear`;

  document.body.appendChild(ghost);

  // บังคับ reflow ให้ transition ทำงาน
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  ghost.offsetHeight;

  // ✅ เป้าหมาย + ย่อ + จาง
  ghost.style.left = `${endX}px`;
  ghost.style.top = `${endY}px`;
  ghost.style.transform = "translate(-50%, -50%) scale(0.35)";
  ghost.style.opacity = "0.25";

  ghost.addEventListener(
    "transitionend",
    () => {
      ghost.remove();
      cartEl.classList.add("cart-pulse");
      setTimeout(() => cartEl.classList.remove("cart-pulse"), 320);
    },
    { once: true }
  );
}

/** หา element ไอคอนตะกร้าใน navbar */
export function getCartIconEl(): HTMLElement | null {
  // ทั้งตอนล็อกอิน (NavLink) และยังไม่ล็อกอิน (button) มีโครงสร้างนี้เหมือนกัน
  return document.querySelector(".nav-cart-link .navbar-icon") as HTMLElement | null;
}
