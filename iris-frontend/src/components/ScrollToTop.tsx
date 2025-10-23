// src/components/ScrollToTop.tsx
import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function resetAllScrolls() {
  const candidates: (Element | null | undefined)[] = [
    document.getElementById("app-shell"),
    document.querySelector("main"),
    document.getElementById("root"),
    document.scrollingElement,            // html หรือ body แล้วแต่เบราว์เซอร์
    document.documentElement,
    document.body,
  ];

  // ปิด smooth ชั่วคราวกันแอนิเมชันค้าง
  const prev: Array<[HTMLElement, string]> = [];
  for (const el of candidates) {
    const node = el as HTMLElement | null;
    if (!node) continue;
    prev.push([node, node.style.scrollBehavior]);
    node.style.scrollBehavior = "auto";
    node.scrollTop = 0;
    node.scrollLeft = 0;
  }
  window.scrollTo(0, 0);

  // คืนค่าพฤติกรรมเดิมในเฟรมถัดไป
  requestAnimationFrame(() => {
    for (const [node, val] of prev) node.style.scrollBehavior = val || "";
  });
}

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  // ให้เลื่อนก่อนเพนต์หน้าใหม่
  useLayoutEffect(() => {
    // ปิด scroll restoration ของเบราว์เซอร์
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    resetAllScrolls();
  }, [pathname, search, hash]);

  // ยิงซ้ำหลังเพนต์ กันเคสภาพโหลดแล้วดันเลย์เอาต์
  useEffect(() => {
    const t = setTimeout(resetAllScrolls, 0);
    return () => clearTimeout(t);
  }, [pathname, search, hash]);

  return null;
}
