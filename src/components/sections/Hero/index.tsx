"use client";

import Link from "next/link";
import { HeroImage } from "@/components/ui/HeroImage";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Hero.module.scss";

type HeroProps = { image?: string; imageMobile?: string; imageAlt?: string };

export function Hero({
  image = "/images/hero.jpg",
  imageMobile,
  imageAlt = "Клубный дом k711 на тихой Пресне",
}: HeroProps = {}) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  // Заголовок держим под шторкой, пока перекрывает прелоудер: свой IO сработал бы
  // сразу при монтировании и анимация отыграла бы «вслепую». Стартуем шторку по
  // сигналу прелоудера (событие preloader:done) — заголовок проявляется на его сходе.
  const [revealed, setRevealed] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const w = window as Window & { __preloaderDone?: boolean };
    if (w.__preloaderDone) {
      setRevealed(true); // прелоудер уже ушёл (кэш/быстрый load/повторный маунт)
      return;
    }
    const onDone = () => setRevealed(true);
    window.addEventListener("preloader:done", onDone, { once: true });
    // Страховка: если прелоудера нет или событие не пришло — покажем заголовок.
    const fallback = window.setTimeout(() => setRevealed(true), 12000);
    return () => {
      window.removeEventListener("preloader:done", onDone);
      window.clearTimeout(fallback);
    };
  }, []);

  // Параллакс фото: при скролле сдвигаем слой картинки внутри media (overflow:hidden).
  useIsomorphicLayoutEffect(() => {
    const media = mediaRef.current;
    const layer = parallaxRef.current;
    if (!media || !layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = media.offsetHeight || 1;
        const progress = Math.min(1, Math.max(0, window.scrollY / h));
        layer.style.setProperty("--py", `${progress * 10}%`);
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
    <section className={styles.hero}>
      <div className={styles.media} ref={mediaRef}>
        <div className={styles.parallax} ref={parallaxRef}>
          <HeroImage
            image={image}
            imageMobile={imageMobile}
            imageAlt={imageAlt}
            className={styles.image}
          />
        </div>

        <div className={styles.overlay}>
          <Reveal
            as="h1"
            variant="lines"
            // hero — первый экран: свой IO не нужен, шторку ведём извне (active),
            // старт по сигналу прелоудера — иначе анимация отыграет под ним «вслепую».
            active={revealed}
            className={styles.title}
          >
            <span className="reveal-line" style={{ "--i": 0 } as CSSProperties}>
              Клубный дом
            </span>
            {/* «на тихой пресне»: на десктопе — одной строкой, на мобиле — двумя
                отдельными reveal-line. Так каждая визуальная строка раскрывается
                СНИЗУ-ВВЕРХ по порядку чтения. (Единая шторка на переносе ломала
                порядок 1→3→2, а reveal-line-down давал разнонаправленную анимацию.) */}
            <span
              className={`reveal-line ${styles.lineDesktop}`}
              style={{ "--i": 1 } as CSSProperties}
            >
              на тихой пресне
            </span>
            <span
              className={`reveal-line ${styles.lineMobile}`}
              style={{ "--i": 1 } as CSSProperties}
            >
              на тихой
            </span>
            <span
              className={`reveal-line ${styles.lineMobile}`}
              style={{ "--i": 2 } as CSSProperties}
            >
              пресне
            </span>
          </Reveal>

          {/* Кнопка — как абзацы в Statement: мягкий fade+сдвиг снизу от ТОГО ЖЕ
              триггера, что и заголовок, с задержкой → появляется вслед за ним. */}
          <Reveal variant="fade" active={revealed} delay={1400} duration={900}>
            <Link href={siteConfig.cta.href} className={styles.cta}>
              {siteConfig.cta.label}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
