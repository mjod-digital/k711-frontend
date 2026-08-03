"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./DesignBureau.module.scss";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type DesignBureauProps = {
  image: string;
  imageAlt: string;
  ctaHref?: string;
  ctaLabel?: string;
  /** Абзац о бюро (редактируется из CMS). */
  paragraph?: ReactNode;
};

// Дефолт = текущий текст (fallback-first).
const DEFAULT_PARAGRAPH: ReactNode =
  "L.BURO рассматривают садовое искусство как способ организации жизни. Авторский метод студии — «Скандинавские сады» — соединяет нордическую сдержанность с петербургской традицией. Результат — лаконичные формы, выверенные пространства и среда для созерцания.";

// Блок об авторах концепции благоустройства (Figma 373-9364 / 397-10276):
// портрет дизайн-бюро, «разбросанный» заголовок «Авторы концепции
// благоустройства L.BURO», абзац о бюро и CTA. Десктоп — абсолютная раскладка
// в долях от артборда (резина держит пропорции). Мобайл — портрет+заголовок в
// .stage фиксированной пропорции, текст течёт под ним.
export function DesignBureau({
  image,
  imageAlt,
  ctaHref = "/apartments",
  ctaLabel = "выбрать резиденцию",
  paragraph = DEFAULT_PARAGRAPH,
}: DesignBureauProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLParagraphElement>(null);

  // Абзац и CTA «выезжают» снизу при входе в вид (как абзацы Terraces / Author):
  // para → CTA со стаггером. data-reveal ставим императивно на секцию — без
  // мигания в SSR. Наблюдаем за абзацем (его реальная позиция = область текста).
  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const trigger = triggerRef.current;
    if (!section || !trigger) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    section.dataset.reveal = "hidden";
    const mqMobile = window.matchMedia("(max-width: 767.98px)");
    let io: IntersectionObserver | null = null;
    const arm = () => {
      io?.disconnect();
      const margin = mqMobile.matches ? "0px 0px -10% 0px" : "0px 0px -20% 0px";
      io = new IntersectionObserver(
        ([entry], obs) => {
          if (entry.isIntersecting) {
            section.dataset.reveal = "visible";
            obs.disconnect();
          }
        },
        { threshold: 0.2, rootMargin: margin },
      );
      io.observe(trigger);
    };
    arm();
    mqMobile.addEventListener("change", arm);
    return () => {
      io?.disconnect();
      mqMobile.removeEventListener("change", arm);
    };
  }, []);

  // Фото разворачивается сверху вниз + заголовок съезжает — как в Terraces / Author.
  // Скролл-скраб ставит --pu (0→1) на секцию с lerp-демпфированием; финал (--pu=1, default
  // в SCSS) = текущая раскладка/макет. reduced-motion → сразу финал. Старт позже (puStart).
  useIsomorphicLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--pu", "1");
      return;
    }
    const mqMobile = window.matchMedia("(max-width: 767.98px)");
    let v = 0;
    let raf = 0;
    let ticking = false;
    const tick = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const target = clamp01((vh - rect.top) / (vh * 0.9));
      v += (target - v) * 0.085;
      const settled = Math.abs(target - v) < 0.0004;
      if (settled) v = target;
      const puStart = mqMobile.matches ? 0.2 : 0.4;
      el.style.setProperty("--pu", String(clamp01((v - puStart) / (1 - puStart))));
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
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.stage}>
        <div className={styles.photo}>
          <div className={styles.unfold}>
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(min-width: 768px) 40vw, 59vw"
              className={styles.image}
            />
          </div>
        </div>

        <h2 className={styles.heading}>
          <span className={styles.avtory}>Авторы</span>
          <span className={styles.koncepcii}>концепции</span>
          <span className={styles.blagoustroystva}>благоустройства</span>
          <span className={styles.lburo}>L.BURO</span>
        </h2>
      </div>

      <div className={styles.body}>
        <p ref={triggerRef} className={styles.para}>{paragraph}</p>
        <Link href={ctaHref} className={styles.cta}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
