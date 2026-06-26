"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./PageHero.module.scss";

export type Crumb = {
  label: string;
  href?: string;
  /** Доступное имя ссылки, если видимый label — сокращение (напр. «…» → «Главная»). */
  ariaLabel?: string;
};

type PageHeroProps = {
  image: string;
  imageAlt: string;
  /** Хлебные крошки: «… / Архитектура». Последний элемент — текущая страница. */
  breadcrumb: Crumb[];
  /** Скаттер-заголовок: спаны с классом `reveal-line` + style `--i`, позиции
   *  задаёт модуль страницы (они абсолютно позиционируются внутри фото). */
  children: ReactNode;
};

// Хедер внутренних страниц: скруглённое фото с рамкой, хлебные крошки сверху,
// «разбросанный» заголовок поверх фото. Переиспользуется всеми внутренними
// страницами — уникален только сам заголовок (передаётся как children).
export function PageHero({ image, imageAlt, breadcrumb, children }: PageHeroProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Лёгкий параллакс фото при скролле (как в Hero главной).
  useIsomorphicLayoutEffect(() => {
    const media = mediaRef.current;
    const layer = parallaxRef.current;
    if (!media || !layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = media.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
        layer.style.setProperty("--py", `${(progress - 0.5) * 10}%`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className={styles.hero}>
      <nav className={styles.breadcrumb} aria-label="Хлебные крошки">
        <ol className={styles.crumbs}>
          {breadcrumb.map((crumb, i) => (
            <li key={i} className={styles.crumb}>
              {i > 0 && (
                <span className={styles.sep} aria-hidden="true">
                  /
                </span>
              )}
              {crumb.href ? (
                <Link href={crumb.href} aria-label={crumb.ariaLabel}>
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.media} ref={mediaRef}>
        <div className={styles.parallax} ref={parallaxRef}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            preload
            sizes="100vw"
            className={styles.image}
          />
        </div>

        <div className={styles.overlay}>
          <Reveal
            as="h1"
            variant="lines"
            // запускаем шторку, когда ВЕСЬ h1 попал в видимую область (threshold>=1),
            // без сдвига рамки — считаем от чистого вьюпорта.
            rootMargin="0px 0px 0px 0px"
            threshold={1}
            className={styles.title}
          >
            {children}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
