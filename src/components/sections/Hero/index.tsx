"use client";

import { HeroImage } from "@/components/ui/HeroImage";
import { useRef, useState } from "react";
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
      </div>
    </section>
  );
}
