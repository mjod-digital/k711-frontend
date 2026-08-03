"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./SpaceSplit.module.scss";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type SpaceSplitProps = {
  image: string;
  imageAlt?: string;
  /** Крупный заголовок (Figma 373-9556 «Пространство / по вашим / правилам»). */
  headingLines: string[];
  /** Два абзаца текста справа. */
  paragraphs: [ReactNode, ReactNode];
  /** Подпись CTA-кнопки под вторым абзацем. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Скролл-анимация как в Terraces/Author (разворот фото + съезд заголовка).
   *  Включается точечно (только /design), иначе секция статична, как раньше. */
  animated?: boolean;
  /** Постраничные переопределения (напр. --ss-mt / --ss-heading-top на design). */
  className?: string;
};

// «Пространство по вашим правилам» (Figma 373-9556): крупный коричневый
// заголовок поверх верха фото слева, два абзаца справа + CTA-кнопка под вторым.
export function SpaceSplit({
  image,
  imageAlt = "",
  headingLines,
  paragraphs,
  ctaLabel = "выбрать резиденцию",
  ctaHref = "/apartments",
  animated = false,
  className,
}: SpaceSplitProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLParagraphElement>(null);

  // Абзацы и CTA «выезжают» снизу при входе в вид (как в Author): p0 → p1 → CTA,
  // со стаггером. data-reveal ставим императивно на секцию — без мигания в SSR.
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

  // Разворот фото сверху вниз + съезд заголовка по --pu — как в Terraces/Author. Только
  // когда animated (на /design); иначе секция статична (residences не трогаем). Скролл-скраб
  // ставит --pu (0→1) на секцию с lerp-демпфированием; финал (--pu=1, default в SCSS) =
  // текущая раскладка. reduced-motion → сразу финал. Старт разворота позже (puStart).
  useIsomorphicLayoutEffect(() => {
    if (!animated) return;
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
  }, [animated]);

  return (
    <section ref={sectionRef} className={cn(styles.section, animated && styles.animated, className)}>
      <div className={styles.headingWrap}>
        <h2 className={styles.heading}>
          {headingLines.map((line, i) => (
            <span key={i} className={styles.hLine}>
              {line}
            </span>
          ))}
        </h2>
      </div>

      <div className={styles.content}>
        <div className={styles.media}>
          <div className={styles.unfold}>
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(min-width: 768px) 36vw, 90vw"
              className={styles.image}
            />
          </div>
        </div>

        <div className={styles.body}>
          <p ref={triggerRef} className={styles.paragraph}>
            {paragraphs[0]}
          </p>
          <div className={styles.col2}>
            <p className={styles.paragraph}>{paragraphs[1]}</p>
            <Link href={ctaHref} className={styles.cta}>
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
