"use client";

import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./PhotoPair.module.scss";

type Photo = {
  src: string;
  alt: string;
  /** Маленькая подпись под фото (P2, brown-medium). */
  caption: string;
  /** Позиция в «лесенке» на мобайле: top (слева) / bottom (справа). */
  position?: "top" | "bottom";
};

// Page-local блок /design (Figma 373-10233 / 397-11494): пара фото с подписью ПОД
// снимком. Фото «разворачиваются» вместе со скроллом (clip-wipe, scrubbed по --intro
// с демпфированием lerp — как в Presentation), а не одноразовой шторкой.
export function PhotoPair({ items }: { items: Photo[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useIsomorphicLayoutEffect(() => {
    const els = refs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;

    // reduced-motion — сразу раскрыты, без скраба.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.style.setProperty("--intro", "1"));
      return;
    }

    const vals = els.map(() => 0);
    els.forEach((el) => el.style.setProperty("--intro", "0")); // старт скрыто (до пейнта)

    let raf = 0;
    let ticking = false;
    const tick = () => {
      const vh = window.innerHeight || 1;
      let settled = true;
      els.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        // 0 — верх фото у нижней кромки экрана; 1 — верх поднялся на ~30% вьюпорта.
        const target = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.7)));
        vals[i] += (target - vals[i]) * 0.085; // демпфирование → плавно за колесом
        if (Math.abs(target - vals[i]) < 0.0004) vals[i] = target;
        else settled = false;
        el.style.setProperty("--intro", String(vals[i]));
      });
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
    };
  }, [items.length]);

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {items.map((it, i) => {
          const bottom = it.position === "bottom";
          return (
            <figure
              key={i}
              className={cn(styles.card, bottom ? styles.bottom : styles.top)}
            >
              <div className={styles.media}>
                <div
                  className={styles.unfold}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                >
                  <Image
                    src={it.src}
                    alt={it.alt}
                    fill
                    sizes="(min-width: 768px) 38vw, 84vw"
                    className={styles.image}
                  />
                </div>
              </div>
              <figcaption className={styles.caption}>{it.caption}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
