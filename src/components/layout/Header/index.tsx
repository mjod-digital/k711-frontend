"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { useFavorites, useHydrated } from "@/store/favorites";
import { cn } from "@/lib/utils";
import { Menu } from "./Menu";
import styles from "./Header.module.scss";

export function Header() {
  const favCount = useFavorites((s) => s.ids.length);
  const hydrated = useHydrated();
  const headerRef = useRef<HTMLElement>(null);
  const lastY = useRef(0);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Скролл вниз → хедер уезжает вверх; скролл вверх → возвращается.
  // У самого верха страницы всегда виден. rAF-throttle + passive — без тормозов.
  useEffect(() => {
    lastY.current = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY);
        const h = headerRef.current?.offsetHeight ?? 0;
        const delta = y - lastY.current;
        if (y <= h) {
          setHidden(false); // у верха — всегда показан
        } else if (delta > 4) {
          setHidden(true); // вниз — прячем
        } else if (delta < -4) {
          setHidden(false); // вверх — показываем
        }
        lastY.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={cn(styles.header, hidden && !menuOpen && styles.hidden)}
      >
      <div className={styles.inner}>
        {/* Левая зона */}
        <div className={styles.cluster}>
          <button
            type="button"
            className={cn(styles.iconBtn, styles.burgerBtn)}
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span
              className={cn(styles.burger, menuOpen && styles.burgerOpen)}
              aria-hidden
            >
              <span />
              <span />
              <span />
            </span>
          </button>

          <a href={siteConfig.phone.href} className={styles.phone}>
            {siteConfig.phone.display}
          </a>
        </div>

        {/* Логотип по центру */}
        <Link href="/" className={styles.logo} aria-label={siteConfig.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt={siteConfig.name}
            width={248}
            height={40}
            className={styles.logoImg}
          />
        </Link>

        {/* Правая зона */}
        <div className={cn(styles.cluster, styles.right)}>
          <a
            href={siteConfig.phone.href}
            className={cn(styles.iconBtn, styles.phoneIcon)}
            aria-label="Позвонить"
          >
            <PhoneIcon />
          </a>

          <Link
            href="/favorites"
            className={cn(styles.iconBtn, styles.favLink)}
            aria-label="Избранное"
          >
            <HeartIcon />
            {hydrated && favCount > 0 && (
              <span className={styles.favBadge}>{favCount}</span>
            )}
          </Link>

          <Link href={siteConfig.cta.href} className={styles.cta}>
            {siteConfig.cta.label}
          </Link>
        </div>
      </div>
      </header>

      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
