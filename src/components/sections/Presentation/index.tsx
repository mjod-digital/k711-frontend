"use client";

import Image from "next/image";
import { useRef } from "react";
import type { ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Presentation.module.scss";

// Контент редактируем из CMS; дефолты = текущие значения (fallback-first).
type PresentationProps = {
  title?: ReactNode;
  description?: ReactNode;
  image?: string;
  imageAlt?: string;
  ctaLabel?: ReactNode;
  ctaHref?: string;
};

export function Presentation({
  title = (
    <>
      Презентация
      <br />о проекте
    </>
  ),
  description = "Получите презентацию проекта и узнайте все детали о клубном доме: от уникальной концепции и локации до планировочных решений и премиальных сервисов.",
  image = "/images/slider-2.png",
  imageAlt = "Клубный дом k711",
  ctaLabel = "Скачать презентацию",
  ctaHref = "/pdf/klimashkina711.pdf",
}: PresentationProps = {}) {
  const ref = useRef<HTMLElement>(null);
  const unfoldRef = useRef<HTMLDivElement>(null);

  // Картинка разворачивается (clip), scrubbed по скроллу, но --intro ДЕМПФИРУЕТСЯ
  // (lerp) → следует за колесом плавно, без рывков. reduced-motion → сразу раскрыта.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    const unfold = unfoldRef.current;
    if (!el || !unfold) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      unfold.style.setProperty("--intro", "1");
      return;
    }

    let v = 0; // сглаженное значение
    let raf = 0;
    let ticking = false;

    const tick = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const target = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.7)));
      v += (target - v) * 0.085; // демпфирование
      const settled = Math.abs(target - v) < 0.0004;
      if (settled) v = target;
      unfold.style.setProperty("--intro", String(v));
      if (!settled) raf = requestAnimationFrame(tick);
      else ticking = false;
    };
    const wake = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(tick);
      }
    };
    wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
      cancelAnimationFrame(raf);
      ticking = false;
    };
  }, []);

  return (
    <section ref={ref} className={styles.presentation}>
      <div className={styles.media}>
        <div className={styles.unfold} ref={unfoldRef}>
          <Image loading="eager"
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 768px) 58vw, 100vw"
            className={styles.image}
          />
        </div>
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.info}>
          <p className={styles.desc}>{description}</p>
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cta}
          >{ctaLabel}</a>
        </div>
      </div>
    </section>
  );
}
