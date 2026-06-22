"use client";

import Image from "next/image";
import { useRef } from "react";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Scenario.module.scss";

export function Scenario() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Параллакс фото при скролле (сдвиг слоя внутри media с overflow:hidden).
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
        const progress = (vh - rect.top) / (vh + rect.height); // 0..1 проход вьюпортом
        const clamped = Math.min(1, Math.max(0, progress));
        layer.style.setProperty("--py", `${(0.5 - clamped) * 16}%`);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className={styles.scenario}>
      <div className={styles.media} ref={mediaRef}>
        <div className={styles.parallax} ref={parallaxRef}>
          <Image
            src="/images/scenario.png"
            alt="Интерьер клубного дома k711"
            fill
            sizes="100vw"
            className={styles.image}
          />
        </div>
        <Reveal as="h2" variant="lines" className={styles.title}>
          <span className={`${styles.line1} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
            квартиры
          </span>
          <span className={`${styles.line2} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
            с вашим
          </span>
          <span className={`${styles.line3} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
            сценарием
          </span>
          <span className={`${styles.line4} reveal-line`} style={{ "--i": 3 } as CSSProperties}>
            жизни
          </span>
        </Reveal>
      </div>
    </section>
  );
}
