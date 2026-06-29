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
  /** Само число — крупно, анимируется 0→значение. Может быть диапазоном «2-4». */
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
};

// Все цифры в строке умножаем на прогресс p (0→1): «157»→«0»…«157», «2-4»→«0-0»…«2-4».
const lerpNumbers = (s: string, p: number) =>
  s.replace(/\d+/g, (d) => String(Math.round(p * Number(d))));

// Три фото-карточки со статистикой (Figma 373-9535): крупное число + мелкая
// подпись снизу-слева. Числа считаются от 0 при появлении секции в виде.
export function ResidenceStats({ items }: ResidenceStatsProps) {
  const ref = useRef<HTMLElement>(null);
  const [p, setP] = useState(0); // общий прогресс счётчика 0..1
  const [revealed, setRevealed] = useState(false); // раскрытие подписей-шторок

  // ОДИН триггер на шторку и счёт. Счёт стартует ПОСЛЕ того, как шторка открыла
  // число (DELAY ≈ длительность реил-шторки) — иначе цифры досчитывались бы за
  // закрытой шторкой и пользователь видел уже финал. Так число «0» проявляется,
  // затем на глазах считается 0→значение.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setP(1);
      setRevealed(true);
      return;
    }
    const mqMobile = window.matchMedia("(max-width: 767.98px)");
    let raf = 0;
    let timer = 0;
    let io: IntersectionObserver | null = null;
    let played = false; // сыграл один раз — не пересобираем наблюдатель
    const DELAY = 900; // ждём, пока реил-шторка раскроет число
    const DUR = 1500;
    const arm = () => {
      io?.disconnect();
      // Уже отсчитали — не пересобираем IO при смене брейкпоинта (resize/поворот
      // через 767.98px): новый наблюдатель для уже-видимой секции сразу выстрелил
      // бы снова и перезапустил счёт с 0.
      if (played) return;
      const margin = mqMobile.matches ? "0px 0px -10% 0px" : "0px 0px -20% 0px";
      io = new IntersectionObserver(
        ([entry], obs) => {
          if (!entry.isIntersecting) return;
          played = true;
          obs.disconnect();
          setRevealed(true); // открываем шторки
          timer = window.setTimeout(() => {
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / DUR);
              setP(1 - Math.pow(1 - t, 3)); // easeOutCubic
              if (t < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
          }, DELAY);
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
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return (
    <section ref={ref} className={styles.section}>
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
                  <span className={styles.num}>
                    {p >= 1 ? it.number : lerpNumbers(it.number, p)}
                  </span>
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
