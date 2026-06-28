"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { CascadeHeading, type CascadeLine } from "@/components/ui/CascadeHeading";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./TextDuo.module.scss";

type TextDuoProps = {
  lines: CascadeLine[];
  paragraphs: [ReactNode, ReactNode];
  /** right — правая колонка (как Statement); full — заголовок и текст на всю ширину. */
  variant?: "right" | "full";
  /** Доп. класс на секцию (напр. переопределить --inner-mobile-width на странице). */
  className?: string;
};

export function TextDuo({ lines, paragraphs, variant = "right", className }: TextDuoProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  // Один триггер на блок: заголовок шторкой, абзацы — следом «выездом» снизу
  // (как в Statement). Один наблюдатель → абзацы никогда не раньше заголовка.
  useIsomorphicLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    const mqMobile = window.matchMedia("(max-width: 767.98px)");
    let io: IntersectionObserver | null = null;
    const arm = () => {
      io?.disconnect();
      const margin = mqMobile.matches ? "0px 0px -10% 0px" : "0px 0px -20% 0px";
      io = new IntersectionObserver(
        ([entry], obs) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            obs.disconnect();
          }
        },
        { threshold: 0.2, rootMargin: margin },
      );
      io.observe(el);
    };
    arm();
    mqMobile.addEventListener("change", arm);
    return () => {
      io?.disconnect();
      mqMobile.removeEventListener("change", arm);
    };
  }, []);

  // Задержка абзацев ≈ длительности анимации заголовка (зависит от числа строк).
  const headingDelay = (lines.length - 1) * 220 + 780;

  return (
    <section className={cn(styles.section, variant === "full" ? styles.full : styles.right, className)}>
      <div className={styles.inner} ref={innerRef}>
        <Reveal variant="lines" active={revealed} className={styles.headingWrap}>
          <CascadeHeading as="h2" lines={lines} className={styles.heading} />
        </Reveal>
        <Reveal
          variant="fade"
          active={revealed}
          className={styles.body}
          delay={headingDelay}
          duration={1000}
        >
          <p className={styles.paragraph}>{paragraphs[0]}</p>
          <p className={styles.paragraph}>{paragraphs[1]}</p>
        </Reveal>
      </div>
    </section>
  );
}
