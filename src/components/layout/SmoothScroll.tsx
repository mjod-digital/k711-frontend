"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Инерционный (плавный) скролл всей страницы.
// - Уважает prefers-reduced-motion (тогда не инициализируется).
// - smoothTouch по умолчанию выключен → на мобиле остаётся нативная инерция,
//   и Swiper/горизонтальные жесты не конфликтуют.
// - Lenis сам обновляет нативную позицию скролла, поэтому sticky-пин галереи,
//   скролл-скраб секций и прячущийся хедер продолжают работать (читают window/rect).
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Плавный переход по якорям (#contact и т.п.) — иначе Lenis даёт резкий прыжок.
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const href = anchor?.getAttribute("href");
      if (!href || href.length < 2) return;
      const dest = document.querySelector(href);
      if (dest) {
        e.preventDefault();
        lenis.scrollTo(dest as HTMLElement);
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return null;
}
