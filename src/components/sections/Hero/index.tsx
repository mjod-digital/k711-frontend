"use client";

import { HeroImage } from "@/components/ui/HeroImage";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Hero.module.scss";

type HeroProps = { image?: string; imageMobile?: string; imageAlt?: string };

export function Hero({
  image = "/images/hero.webp",
  imageMobile,
  imageAlt = "Клубный дом k711 на тихой Пресне",
}: HeroProps = {}) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
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

  // Автоплей hero-видео: muted+playsInline → политика автоплея пускает. НЕ играем при
  // reduced-motion (виден статичный кадр = HeroImage под видео). Видео стартует
  // прозрачным и проявляется по событию playing — до старта виден приоритетный
  // HeroImage (верный кроп моб/десктоп, LCP, хук прелоудера), без чёрного мелькания.
  useIsomorphicLayoutEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.play().catch(() => {});
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.media} ref={mediaRef}>
        <div className={styles.parallax} ref={parallaxRef}>
          {/* Под видео — приоритетная картинка (data-hero): её ждёт прелоудер, она же
              LCP-кадр и фолбэк (виден до старта видео и при reduced-motion, с верным
              кропом моб/десктоп). */}
          <HeroImage
            image={image}
            imageMobile={imageMobile}
            imageAlt={imageAlt}
            className={styles.image}
          />
          {/* Видео-фон поверх. muted+loop+playsInline → автоплеится. Проявляется
              (opacity) по playing — без чёрного мелькания и без poster-рассинхрона. */}
          <video
            ref={videoRef}
            className={cn(styles.image, styles.video, videoPlaying && styles.videoPlaying)}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onPlaying={() => setVideoPlaying(true)}
          >
            <source src="/video/k711-hero.mp4" type="video/mp4" />
          </video>
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
        </div>
      </div>
    </section>
  );
}
