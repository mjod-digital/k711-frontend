"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Инерционный (плавный) скролл всей страницы.
// - Уважает prefers-reduced-motion (тогда не инициализируется).
// - smoothTouch по умолчанию выключен → на мобиле остаётся нативная инерция,
//   и Swiper/горизонтальные жесты не конфликтуют.
// - Lenis сам обновляет нативную позицию скролла, поэтому sticky-пин галереи,
//   скролл-скраб секций и прячущийся хедер продолжают работать (читают window/rect).
export function SmoothScroll() {
  const pathname = usePathname();

  // Скролл наверх при переходе между страницами. Lenis держит СВОЮ внутреннюю
  // позицию и каждый кадр переписывает ею нативный скролл, поэтому дефолтный
  // scroll-to-top Next не срабатывает — на новой странице оказываемся не сверху.
  // Сбрасываем и Lenis (immediate — без анимации), и нативный скролл (fallback
  // для reduced-motion, где Lenis не создан).
  useEffect(() => {
    const lenis = (window as Window & { __lenis?: Lenis }).__lenis;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      // мягче «разгон» при быстрой прокрутке колесом (не улетаем сразу в самый низ)
      wheelMultiplier: 0.8,
      // Меню скроллит свой вложенный Lenis — глобальный игнорирует колесо над ним
      // (панель фиксирована, страница за ней не едет). Список каталога тоже на вложенном
      // Lenis, но его НЕ префентим: у края списка встроенный lenisStopPropagation отпускает
      // колесо, и глобальный Lenis доводит страницу к футеру/герою (чейнинг секции).
      prevent: (node) => !!node?.closest?.("[data-menu-scroll]"),
    });

    // Доступ к инстансу для прелоудера (он лочит/разлочивает скролл первого экрана).
    (window as Window & { __lenis?: Lenis }).__lenis = lenis;

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
      delete (window as Window & { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return null;
}
