"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Author.module.scss";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type AuthorProps = {
  image: string;
  imageAlt: string;
  ctaHref?: string;
  ctaLabel?: string;
  /** Два абзаца био (редактируются из CMS). */
  paragraphs?: [ReactNode, ReactNode];
};

// Дефолт = текущий текст (fallback-first).
const DEFAULT_PARAGRAPHS: [ReactNode, ReactNode] = [
  "Он известен проектами в Москве, Санкт-Петербурге и Берлине, включая участие в создании башни «Федерация» в «Москва-Сити» и ряда крупных общественных и культурных зданий.",
  "Чобан активно развивает графическую практику и основал в Берлине Музей архитектурного рисунка, где коллекционируются и экспонируются работы разных эпох.",
];

// Блок об авторе проекта (Figma 373-9301 / 373-13114): портрет, «разбросанный»
// заголовок, два абзаца и CTA. Десктоп — абсолютная раскладка в долях от
// артборда (резина держит пропорции). Мобайл — портрет+заголовок в .stage
// фиксированной пропорции, текст течёт под ним (не упирается в след. секцию).
export function Author({
  image,
  imageAlt,
  ctaHref = "/apartments",
  ctaLabel = "выбрать резиденцию",
  paragraphs = DEFAULT_PARAGRAPHS,
}: AuthorProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLParagraphElement>(null);

  // Текст «выезжает» снизу при входе в вид (как абзацы Terraces): col1 → col2 →
  // CTA, со стаггером. data-reveal ставим императивно на секцию (не через state),
  // чтобы он не попал в SSR-HTML как "hidden" и текст не моргал бы без JS.
  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const trigger = triggerRef.current;
    if (!section || !trigger) return;
    // reduced-motion: не вооружаем — без data-reveal текст сразу виден.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    section.dataset.reveal = "hidden"; // прячем синхронно до отрисовки
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
      io.observe(trigger); // наблюдаем за col1 — его реальная позиция = область текста
    };
    arm();
    mqMobile.addEventListener("change", arm);
    return () => {
      io?.disconnect();
      mqMobile.removeEventListener("change", arm);
    };
  }, []);

  // Фото «разворачивается» сверху вниз — та же анимация, что у картинки Terraces
  // (скролл-скраб --pu, окно у верхней кромки растёт вниз). Финал (--pu=1, default в
  // SCSS) — фото показано целиком в текущей раскладке/по макету. Демпфирование (lerp)
  // → плавно; reduced-motion → сразу финал. Старт разворота позже (puStart), как в Terraces.
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
          <span className={styles.avtor}>Автор</span>
          <span className={styles.proekta}>проекта</span>
          <span className={styles.sergey}>Сергей</span>
          <span className={styles.choban}>Чобан</span>
        </h2>
      </div>

      <p ref={triggerRef} className={styles.col1}>{paragraphs[0]}</p>

      <div className={styles.col2}>
        <p className={styles.para}>{paragraphs[1]}</p>
        <Link href={ctaHref} className={styles.cta}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
