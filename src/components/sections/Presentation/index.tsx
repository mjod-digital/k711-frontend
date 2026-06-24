"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Presentation.module.scss";

export function Presentation() {
  const ref = useRef<HTMLElement>(null);
  const unfoldRef = useRef<HTMLDivElement>(null);

  // Картинка разворачивается (clip), scrubbed по скроллу, но --intro ДЕМПФИРУЕТСЯ
  // (lerp) → следует за колесом плавно, без рывков. reduced-motion → сразу раскрыта.
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    const unfold = unfoldRef.current;
    if (!el || !unfold) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      unfold.style.setProperty("--intro", "1");
      return;
    }

    let v = 0; // сглаженное значение
    let raf = 0;
    let ticking = false;

    const tick = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const target = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.7)));
      v += (target - v) * 0.085; // демпфирование
      const settled = Math.abs(target - v) < 0.0004;
      if (settled) v = target;
      unfold.style.setProperty("--intro", String(v));
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
  }, []);

  return (
    <section ref={ref} className={styles.presentation}>
      <div className={styles.media}>
        <div className={styles.unfold} ref={unfoldRef}>
          <Image
            src="/images/slider-2.png"
            alt="Клубный дом k711"
            fill
            sizes="(min-width: 768px) 58vw, 100vw"
            className={styles.image}
          />
        </div>
      </div>

      <div className={styles.content}>
        <h2 className={styles.title}>
          Презентация
          <br />о проекте
        </h2>
        <div className={styles.info}>
          <p className={styles.desc}>
            Получите презентацию проекта и узнайте все детали о клубном доме: от
            уникальной концепции и локации до планировочных решений и премиальных
            сервисов.
          </p>
          <Link href="#" className={styles.cta}>
            Скачать презентацию
          </Link>
        </div>
      </div>
    </section>
  );
}
