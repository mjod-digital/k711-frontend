"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { CascadeHeading, type CascadeLine } from "@/components/ui/CascadeHeading";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Terraces.module.scss";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Контент по умолчанию — страница «Архитектура». Любую часть можно
// переопределить пропсами, чтобы переиспользовать секцию на других страницах
// (напр. «Аменитис» — «Дом, в котором город остаётся снаружи»).
const DEFAULT_DESKTOP_LINES: CascadeLine[] = [
  { parts: [{ text: "Дом, где история", big: true }] },
  { parts: [{ text: "не замолкает", big: true }] },
];
const DEFAULT_MOBILE_LINES: CascadeLine[] = [
  { parts: [{ text: "Дом,", big: true }] },
  { parts: [{ text: "где история", big: true }] },
  { parts: [{ text: "не замолкает", big: true }] },
];

type TerracesProps = {
  /** Заголовок на десктопе (2 строки в макете). */
  desktopLines?: CascadeLine[];
  /** Заголовок на мобайле (уже, в 3 строки). */
  mobileLines?: CascadeLine[];
  image?: string;
  imageAlt?: string;
  paragraphs?: [ReactNode, ReactNode];
};

export function Terraces({
  desktopLines = DEFAULT_DESKTOP_LINES,
  mobileLines = DEFAULT_MOBILE_LINES,
  image = "/images/terraces.png",
  imageAlt = "Фасад k711 — сохранённая историческая стена",
  paragraphs,
}: TerracesProps = {}) {
  const ref = useRef<HTMLElement>(null);
  const colsRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);

  // Абзацы — триггерный «выезд» снизу (как в Statement), один раз при входе в вид
  // (вместо скраб-привязки к --pu): мягко, ровно, не зависит от скорости скролла.
  // data-reveal ставим императивно (не через state) — иначе он попал бы в SSR-HTML
  // как "hidden" и текст моргал бы / был скрыт без JS.
  useIsomorphicLayoutEffect(() => {
    const el = colsRef.current;
    if (!el) return;
    // reduced-motion: не вооружаем — без data-reveal абзацы сразу видны.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.dataset.reveal = "hidden"; // прячем синхронно до отрисовки
    const mqMobile = window.matchMedia("(max-width: 767.98px)");
    let io: IntersectionObserver | null = null;
    const arm = () => {
      io?.disconnect();
      const margin = mqMobile.matches ? "0px 0px -10% 0px" : "0px 0px -20% 0px";
      io = new IntersectionObserver(
        ([entry], obs) => {
          if (entry.isIntersecting) {
            el.dataset.reveal = "visible";
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

  // Мобайл (макет 373-12537): заголовок в 3 строки и уже; десктоп — 2 строки.
  useIsomorphicLayoutEffect(() => {
    const mql = window.matchMedia("(max-width: 767.98px)");
    const decide = () => setMobile(mql.matches);
    decide();
    mql.addEventListener("change", decide);
    return () => mql.removeEventListener("change", decide);
  }, []);

  // Скролл-скраб: --p (0→1) по проходу секции. Заголовок опускается вниз НА фото,
  // фото разворачивается сверху вниз, текст всплывает. Демпфирование (lerp) →
  // плавно. reduced-motion → сразу финальное состояние.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }
    // мобайл — разворот фото/текста (--pu) стартует чуть раньше (ниже порог)
    const puStart = mobile ? 0.2 : 0.4;
    const puSpan = 1 - puStart;
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
      el.style.setProperty("--p", String(v));
      // фото разворачивается ПОЗЖЕ — когда заголовок/текст уже наезжает на него
      el.style.setProperty("--pu", String(clamp01((v - puStart) / puSpan)));
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
  }, [mobile]);

  return (
    <section ref={ref} className={styles.terraces}>
      <div className={styles.headingWrap}>
        <CascadeHeading
          as="h2"
          lines={mobile ? mobileLines : desktopLines}
          className={styles.heading}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.media}>
          <div className={styles.unfold}>
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(min-width: 768px) 37vw, 100vw"
              className={styles.image}
            />
          </div>
        </div>

        <div className={styles.cols} ref={colsRef}>
          <p className={styles.paragraph}>
            {paragraphs?.[0] ?? (
              <>
                В основании k 7/11 — стена первого московского «тучереза»,
                построенного Эрнстом-Рихардом Нирнзее в 1905 году. Она бережно
                сохранена и стала частью нового облика дома. Современные линии
                панорамных окон и чёткая геометрия фасада не спорят с историей —
                они подчёркивают её, создавая контрастную гармонию.
              </>
            )}
          </p>
          <p className={styles.paragraph}>
            {paragraphs?.[1] ?? (
              <>
                Проект Сергея Чобана превращает здание в архитектурный диалог:
                каждый элемент здесь — одновременно жест уважения к прошлому и шаг
                вперёд.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
