"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Author.module.scss";

type AuthorProps = {
  image: string;
  imageAlt: string;
  ctaHref?: string;
  ctaLabel?: string;
};

// Блок об авторе проекта (Figma 373-9301 / 373-13114): портрет, «разбросанный»
// заголовок, два абзаца и CTA. Десктоп — абсолютная раскладка в долях от
// артборда (резина держит пропорции). Мобайл — портрет+заголовок в .stage
// фиксированной пропорции, текст течёт под ним (не упирается в след. секцию).
export function Author({
  image,
  imageAlt,
  ctaHref = "/residences",
  ctaLabel = "выбрать резиденцию",
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

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.stage}>
        <div className={styles.photo}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 768px) 40vw, 59vw"
            className={styles.image}
          />
        </div>

        <Reveal variant="lines" as="h2" className={styles.heading}>
          <span className={`${styles.avtor} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
            Автор
          </span>
          <span className={`${styles.proekta} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
            проекта
          </span>
          <span className={`${styles.sergey} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
            Сергей
          </span>
          <span className={`${styles.choban} reveal-line`} style={{ "--i": 3 } as CSSProperties}>
            Чобан
          </span>
        </Reveal>
      </div>

      <p ref={triggerRef} className={styles.col1}>
        Он известен проектами в Москве, Санкт-Петербурге и Берлине, включая
        участие в создании башни «Федерация» в «Москва-Сити» и ряда крупных
        общественных и культурных зданий.
      </p>

      <div className={styles.col2}>
        <p className={styles.para}>
          Чобан активно развивает графическую практику и основал в Берлине Музей
          архитектурного рисунка, где коллекционируются и экспонируются работы
          разных эпох.
        </p>
        <Link href={ctaHref} className={styles.cta}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
