"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CascadeHeading, type CascadeLine } from "@/components/ui/CascadeHeading";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./PhotoCards.module.scss";

export type PhotoCard = {
  src: string;
  alt: string;
  /** Заголовок-подпись поверх фото (каскадная разметка). */
  lines: CascadeLine[];
  /** Раскладка строк для мобайла, если отличается от десктопной (как в Showcase). */
  linesMobile?: CascadeLine[];
  /** Позиция подписи: top (по умолчанию) или bottom. */
  position?: "top" | "bottom";
};

type PhotoCardsProps = {
  items: PhotoCard[];
  /** Доп. класс на секцию — для постраничных отступов (напр. amenities). */
  className?: string;
  /** Затемнение поверх фото: true — «уголковый» скрим (amenities);
   *  "soft" — мягкое затемнение снизу (improvement). */
  scrim?: boolean | "soft";
};

// Пара фото-карточек с заголовком поверх (Figma 373-9288). Десктоп — две в ряд;
// мобайл — друг под другом «лесенкой» (первая прижата влево, вторая — вправо).
export function PhotoCards({ items, className, scrim = false }: PhotoCardsProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [mobile, setMobile] = useState(false);

  // Флаг мобайла для linesMobile. Отдельным эффектом: основной ниже уходит в
  // ранний return при reduced-motion, а раскладка строк от motion не зависит.
  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // ОДИН триггер на обе подписи: иначе у каждой карточки свой наблюдатель и они
  // раскрываются вразнобой (особенно «лесенкой» на мобайле). Наблюдаем за сеткой —
  // оба заголовка проявляются синхронно.
  useIsomorphicLayoutEffect(() => {
    const el = gridRef.current;
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

  return (
    <section className={cn(styles.section, className)}>
      <div className={styles.grid} ref={gridRef}>
        {items.map((it, i) => {
          const bottom = it.position === "bottom";
          return (
            <figure
              key={i}
              className={cn(styles.card, bottom ? styles.bottom : styles.top)}
            >
              <Image
                src={it.src}
                alt={it.alt}
                fill
                sizes="(min-width: 768px) 48vw, 84vw"
                className={styles.image}
              />
              {scrim && (
                <span
                  className={scrim === "soft" ? styles.scrimSoft : styles.scrim}
                  aria-hidden="true"
                />
              )}
              <figcaption className={styles.label}>
                <Reveal variant="lines" active={revealed}>
                  <CascadeHeading
                    as="div"
                    tone="white"
                    lines={(mobile && it.linesMobile) || it.lines}
                  />
                </Reveal>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
