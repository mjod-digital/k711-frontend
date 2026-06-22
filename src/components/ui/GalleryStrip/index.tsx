"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./GalleryStrip.module.scss";

export type GalleryItem = {
  src: string;
  caption?: string;
  alt?: string;
  /** wide ≈ 1100, narrow ≈ 520 (по макету 373-10064). По умолчанию wide. */
  variant?: "wide" | "narrow";
};

type GalleryStripProps = {
  items: GalleryItem[];
  className?: string;
};

export function GalleryStrip({ items, className }: GalleryStripProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pinned, setPinned] = useState(false);

  // Десктоп: секция «пинится» (sticky), вертикальный скролл ведёт ленту
  // горизонтально через translateX. Нативный скролл НЕ перехватывается — просто
  // считаем прогресс прохода секции и мапим его в сдвиг ленты (трансформ кладём
  // прямо в DOM по ref, без ре-рендера на кадр). Мобайл / reduced-motion →
  // обычный горизонтальный скролл (см. CSS .native).
  // 1) Решаем режим: пин (десктоп без reduced-motion) или нативный скролл.
  useIsomorphicLayoutEffect(() => {
    const mqlDesktop = window.matchMedia("(min-width: 768px)");
    const mqlReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => setPinned(mqlDesktop.matches && !mqlReduce.matches);
    decide();
    mqlDesktop.addEventListener("change", decide);
    mqlReduce.addEventListener("change", decide);
    return () => {
      mqlDesktop.removeEventListener("change", decide);
      mqlReduce.removeEventListener("change", decide);
    };
  }, []);

  // 2) Пин (десктоп) — полоса МАКЕТНОЙ высоты (НЕ 100vh), центрированная по
  //    вертикали; вертикальный скролл ведёт ленту горизонтально (translateX).
  //    Мобайл — вертикальный параллакс каждой картинки. reduced-motion — статика.
  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    if (!section || !sticky || !track) return;

    // отбрасываем «хвостовые» ссылки, если кадров стало меньше
    boxRefs.current.length = items.length;

    const clamp = (n: number) => Math.min(1, Math.max(0, n));

    // ---- НЕ пин (мобайл / reduced-motion) ----
    if (!pinned) {
      section.style.height = "";
      sticky.style.top = "";
      track.style.transform = "";

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const isMobile = !window.matchMedia("(min-width: 768px)").matches;
      if (reduce || !isMobile) {
        boxRefs.current.forEach((el) => el?.style.removeProperty("--par"));
        return;
      }

      // Мобайл: у каждой картинки свой вертикальный параллакс (−0.5..0.5).
      let raf = 0;
      const apply = () => {
        const vh = window.innerHeight || 1;
        boxRefs.current.forEach((el) => {
          if (!el) return;
          const r = el.getBoundingClientRect();
          const progress = clamp((vh - r.top) / (vh + r.height));
          el.style.setProperty("--par", String(0.5 - progress));
        });
      };
      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(apply);
      };
      apply();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        cancelAnimationFrame(raf);
      };
    }

    // ---- ПИН (десктоп) ----
    boxRefs.current.forEach((el) => el?.style.removeProperty("--par"));
    let travel = 0;
    let topOffset = 0;
    let raf = 0;

    const apply = () => {
      const top = section.getBoundingClientRect().top;
      // прогресс закрепления: 0 в момент центрирования полосы, 1 — лента доехала
      const p = travel > 0 ? clamp((topOffset - top) / travel) : 0;
      track.style.transform = `translate3d(${-(p * travel)}px, 0, 0)`;
    };

    const measure = () => {
      // натуральная (макетная) высота полосы → центрируем её по вертикали
      sticky.style.top = "";
      const stickyH = sticky.offsetHeight;
      topOffset = Math.max(0, (window.innerHeight - stickyH) / 2);
      sticky.style.top = `${topOffset}px`;
      // длина горизонтального пути = насколько лента шире вьюпорта
      travel = Math.max(0, track.scrollWidth - window.innerWidth);
      // высота секции = высота полосы + путь: ровно столько секция «залипает»
      section.style.height = `${stickyH + travel}px`;
      apply();
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [pinned, items.length]);

  // Мобайл (макет 373-12515): «узкие» кадры смещаются вправо/влево поочерёдно.
  let narrowSeen = 0;
  const narrowSide = items.map((it) =>
    it.variant === "narrow" ? (narrowSeen++ % 2 === 0 ? "right" : "left") : undefined,
  );

  return (
    <section
      ref={sectionRef}
      className={cn(styles.section, pinned ? styles.pinned : styles.native, className)}
    >
      <div ref={stickyRef} className={styles.sticky}>
        <div ref={trackRef} className={styles.track}>
          {items.map((it, i) => {
            const isNarrow = it.variant === "narrow";
            return (
              <figure
                key={i}
                className={cn(styles.item, isNarrow ? styles.narrow : styles.wide)}
                data-side={narrowSide[i]}
              >
                <div
                  className={styles.imageBox}
                  ref={(el) => {
                    boxRefs.current[i] = el;
                  }}
                >
                  <div className={styles.parallax}>
                    <Image
                      src={it.src}
                      alt={it.alt ?? it.caption ?? ""}
                      fill
                      sizes={`(min-width: 768px) 76vw, ${isNarrow ? "59vw" : "96vw"}`}
                      className={styles.image}
                    />
                  </div>
                </div>
                {it.caption && (
                  <figcaption className={styles.caption}>{it.caption}</figcaption>
                )}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
