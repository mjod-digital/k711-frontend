"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Lenis from "lenis";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import styles from "./Menu.module.scss";

// Эффект «матовое стекло» задаём ИНЛАЙНОМ: CSS-оптимизатор Next 16 выкидывает
// backdrop-filter из скомпилированного правила (баг), инлайн он не трогает.
const FROST: CSSProperties = {
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
};

// Все пункты ведут на существующие страницы. «Офис продаж» = контакты (/contact).
// Пункты без своей страницы (напр. «Историческая справка») убраны.
const NAV = [
  { label: "Главная", href: "/" },
  { label: "Локация", href: "/location" },
  { label: "Архитектура", href: "/architecture" },
  { label: "Дизайн и искусство", href: "/design" },
  { label: "Аменитис", href: "/amenities" },
  { label: "Благоустройство", href: "/improvement" },
  { label: "Резиденции", href: "/residences" },
  { label: "Паркинг", href: "/technologies" },
  { label: "Офис продаж", href: "/contact" },
];

const PICK = [
  { label: "Выбор по параметрам", href: "/apartments" },
  { label: "Визуальный выбор", href: "/apartments" },
];

type MenuProps = { open: boolean; onClose: () => void };

export function Menu({ open, onClose }: MenuProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // (1) Десктоп: масштабируем содержимое панели под высоту окна (zoom), чтобы не
  //     было скролла при разумной высоте. Привязка к высоте окна с полом в 600px:
  //     ниже — скейл «замерзает» и добавляется скролл. Мобайл — без скейла.
  // (2) Инерционный скролл панели (вложенный Lenis на .scroll). Глобальный Lenis
  //     игнорирует колесо над [data-menu-scroll] (см. SmoothScroll). reduced-motion
  //     → нативный скролл (но скейл всё равно работает).
  useEffect(() => {
    if (!open) return;
    const wrapper = scrollRef.current;
    const content = wrapper?.firstElementChild as HTMLElement | null;
    if (!wrapper || !content) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mqMobile = window.matchMedia("(max-width: 767.98px)");

    const applyScale = () => {
      if (mqMobile.matches) {
        content.style.removeProperty("zoom");
        content.style.removeProperty("min-height");
        return;
      }
      // меряем НАТУРАЛЬНУЮ высоту контента — без зума и без заливки высоты
      content.style.setProperty("zoom", "1");
      content.style.setProperty("min-height", "0");
      const natural = content.offsetHeight;
      // паддинги .scroll НЕ зумятся (они на обёртке) → вычитаем их из доступной высоты
      const cs = getComputedStyle(wrapper);
      const vpad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const avail = wrapper.clientHeight - vpad; // место под контент в панели
      const chrome = window.innerHeight - avail; // хром вокруг (по высоте — константа)
      const avail600 = Math.max(0, 600 - chrome); // доступное при окне 600px
      const scale = Math.min(1, Math.max(avail, avail600) / Math.max(1, natural));
      // Заливаем высоту так, чтобы ПОСЛЕ зума контент занял всю доступную область →
      // margin-top:auto у логотипа прижимает его к самому низу даже на высоких окнах
      // (а на низких окнах контент длиннее avail → скролл, лого в самом низу прокрутки).
      content.style.setProperty("min-height", `${avail / scale}px`);
      content.style.setProperty("zoom", String(scale));
    };
    applyScale();

    let lenis: Lenis | null = null;
    let raf = 0;
    if (!reduce) {
      lenis = new Lenis({ wrapper, content, lerp: 0.1, smoothWheel: true });
      const loop = (t: number) => {
        lenis?.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    const onResize = () => {
      applyScale();
      lenis?.resize();
    };
    window.addEventListener("resize", onResize);
    mqMobile.addEventListener("change", onResize);
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      window.removeEventListener("resize", onResize);
      mqMobile.removeEventListener("change", onResize);
      content.style.removeProperty("zoom");
      content.style.removeProperty("min-height");
    };
  }, [open]);

  // Esc закрывает, body не скроллится пока меню открыто.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Возврат фокуса на триггер (бургер) при закрытии: иначе после Esc / клика мимо
  // фокус остаётся на уже скрытых (tabindex -1, aria-hidden) пунктах меню.
  // Ключ только [open] — чтобы не воровать фокус на каждый ре-рендер шапки.
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    return () => trigger?.focus?.();
  }, [open]);

  const tab = open ? 0 : -1;

  return (
    <div className={cn(styles.root, open && styles.open)} aria-hidden={!open}>
      {/* Клик мимо панели закрывает (на десктопе справа видна страница) */}
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Закрыть меню"
        tabIndex={tab}
        onClick={onClose}
      />

      <nav className={styles.panel} style={FROST} aria-label="Главное меню">
        {/* data-menu-scroll: глобальный Lenis игнорирует колесо здесь; скроллит вложенный */}
        <div className={styles.scroll} data-menu-scroll ref={scrollRef}>
          <div className={styles.scrollInner}>
            <div className={styles.group}>
              <p className={styles.label}>Меню</p>
              <ul className={styles.list}>
                {NAV.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={styles.link}
                      tabIndex={tab}
                      onClick={onClose}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.group}>
              <p className={styles.label}>Выбрать квартиру</p>
              <ul className={styles.list}>
                {PICK.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={styles.link}
                      tabIndex={tab}
                      onClick={onClose}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Телефон в панели — только на мобайле (на десктопе он в шапке) */}
            <div className={cn(styles.group, styles.contacts)}>
              <p className={styles.label}>Офис продаж</p>
              <a href={siteConfig.phone.href} className={styles.phone} tabIndex={tab}>
                {siteConfig.phone.display}
              </a>
            </div>

            {/* Логотип MR Private — последний элемент scrollInner: масштабируется
                вместе с меню (zoom) и прижат к низу (макет 373-10156 «logo second»). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mr-private.svg"
              alt="MR Private"
              className={styles.brand}
              width={134}
              height={20}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}
