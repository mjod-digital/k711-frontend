"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./ResidenceStats.module.scss";

export type ResidenceStat = {
  src: string;
  alt: string;
  /** Мелкий текст перед числом (например «до»). */
  prefix?: string;
  /** Само число — крупно. Может быть диапазоном «2-4». */
  number: string;
  /** Мелкий текст после числа (например «м²», «квартиры»). */
  suffix?: ReactNode;
  /** На мобайле перенести суффикс под число (напр. «2-4» / «квартиры»). */
  suffixBelow?: boolean;
  /** Подпись под числом. */
  caption: ReactNode;
  /** Позиция карточки в «лесенке» (мобайл): left | center | right. */
  place?: "left" | "center" | "right";
  /** object-position фото — для панорамы-триптиха (одно фото, нарезанное по карточкам). */
  objectPosition?: string;
};

type ResidenceStatsProps = {
  items: ResidenceStat[];
  /** Постраничные переопределения отступов (--rs-mt / --rs-mb). */
  className?: string;
};

// Три фото-карточки со статистикой (Figma 373-9535): крупное число + мелкая
// подпись снизу-слева. Число и подпись проявляются реил-шторкой при входе секции
// в вид (счётчика 0→значение нет — число показывается сразу финальным).
export function ResidenceStats({ items, className }: ResidenceStatsProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false); // раскрытие подписей-шторок

  // ОДИН триггер на шторку: при входе секции в вид открываем число и подпись.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    const mqMobile = window.matchMedia("(max-width: 767.98px)");
    let io: IntersectionObserver | null = null;
    let played = false; // сыграл один раз — не пересобираем наблюдатель
    const arm = () => {
      io?.disconnect();
      // Уже сыграл — не пересобираем IO при смене брейкпоинта (resize/поворот
      // через 767.98px): новый наблюдатель для уже-видимой секции сразу выстрелил бы.
      if (played) return;
      const margin = mqMobile.matches ? "0px 0px -10% 0px" : "0px 0px -20% 0px";
      io = new IntersectionObserver(
        ([entry], obs) => {
          if (!entry.isIntersecting) return;
          played = true;
          obs.disconnect();
          setRevealed(true); // открываем шторки
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
    <section ref={ref} className={cn(styles.section, className)}>
      <div className={styles.grid}>
        {items.map((it, i) => (
          <figure key={i} className={cn(styles.card, styles[it.place ?? "left"])}>
            <Image
              src={it.src}
              alt={it.alt}
              fill
              sizes="(min-width: 768px) 30vw, 83vw"
              className={styles.image}
              style={it.objectPosition ? { objectPosition: it.objectPosition } : undefined}
            />
            <span className={styles.scrim} aria-hidden="true" />
            <figcaption className={styles.label}>
              <Reveal variant="lines" active={revealed}>
                <span
                  className={`${styles.value} reveal-line`}
                  style={{ "--i": 0 } as CSSProperties}
                >
                  {it.prefix && <span className={styles.qual}>{it.prefix}</span>}
                  <span className={styles.num}>{it.number}</span>
                  {it.suffix && (
                    <span className={cn(styles.qual, it.suffixBelow && styles.qualBelow)}>
                      {it.suffix}
                    </span>
                  )}
                </span>
                <span
                  className={`${styles.caption} reveal-line`}
                  style={{ "--i": 1 } as CSSProperties}
                >
                  {it.caption}
                </span>
              </Reveal>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
