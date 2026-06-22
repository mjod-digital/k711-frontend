"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { GalleryStrip } from "@/components/ui/GalleryStrip";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./Slider.module.scss";
import "swiper/css";

export type Slide = {
  src: string;
  alt?: string;
  caption?: string;
};

type SliderProps = {
  slides: Slide[];
  className?: string;
  /** Мобайл: показывать «шахматкой» как GalleryStrip (макет 373-12585), не каруселью. */
  mobileGallery?: boolean;
};

export function Slider({ slides, className, mobileGallery = false }: SliderProps) {
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [mobileGalleryMode, setMobileGalleryMode] = useState(false);

  // Решаем, показывать ли «шахматку» вместо карусели (только если mobileGallery).
  useIsomorphicLayoutEffect(() => {
    if (!mobileGallery) return;
    const mql = window.matchMedia("(max-width: 767.98px)");
    const decide = () => setMobileGalleryMode(mql.matches);
    decide();
    mql.addEventListener("change", decide);
    return () => mql.removeEventListener("change", decide);
  }, [mobileGallery]);

  // Зазор «резиновый» (fluid(80) на десктопе), но отдаём его Swiper'у через
  // spaceBetween — иначе centeredSlides не учитывает CSS-margin и активный
  // слайд встаёт не по центру. На мобайле зазора нет.
  const [spaceBetween, setSpaceBetween] = useState(0);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setSpaceBetween(w >= 768 ? (80 / 1440) * w : 0);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Параллакс при скролле: двигаем картинки внутри контейнеров (overflow:hidden).
  // Прогресс прохода вьюпортом через экран (0 — входит снизу, 1 — уходит вверх)
  // пишем в CSS-переменную --parallax на корне; все .parallax её наследуют.
  // rAF-throttle + passive; уважаем prefers-reduced-motion.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const center = rect.top + rect.height / 2;
        const progress = Math.max(0, Math.min(1, 1 - center / vh));
        el.style.setProperty("--parallax", `${(0.5 - progress) * 16}%`);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Мобайл (макет 373-12585): «шахматка» как GalleryStrip вместо карусели.
  if (mobileGalleryMode) {
    return (
      <GalleryStrip
        className={className}
        items={slides.map((s, i) => ({
          src: s.src,
          caption: s.caption,
          alt: s.alt,
          variant: i % 2 === 0 ? "wide" : "narrow",
        }))}
      />
    );
  }

  return (
    <section className={cn(styles.slider, className)}>
      <div className={styles.viewport} ref={viewportRef}>
        <Swiper
          modules={[Navigation]}
          navigation={{ prevEl, nextEl }}
          slidesPerView="auto"
          centeredSlides
          loop={slides.length > 2}
          spaceBetween={spaceBetween}
          speed={700}
          className={styles.swiper}
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={i} className={styles.slide}>
              <div className={styles.imageBox}>
                <div className={styles.parallax}>
                  <Image
                    src={slide.src}
                    alt={slide.alt ?? slide.caption ?? ""}
                    fill
                    sizes="(min-width: 768px) 76vw, 86vw"
                    className={styles.image}
                  />
                </div>
              </div>
              {slide.caption && <p className={styles.caption}>{slide.caption}</p>}
            </SwiperSlide>
          ))}
        </Swiper>

        <div className={styles.fadeLeft} aria-hidden />
        <div className={styles.fadeRight} aria-hidden />

        <button
          ref={setPrevEl}
          type="button"
          className={cn(styles.arrow, styles.prev)}
          aria-label="Предыдущий слайд"
        >
          <ArrowIcon />
        </button>
        <button
          ref={setNextEl}
          type="button"
          className={cn(styles.arrow, styles.next)}
          aria-label="Следующий слайд"
        >
          <ArrowIcon />
        </button>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.7778 21.5547L6.99966 13.7765L14.7778 5.99834" stroke="currentColor" />
      <path d="M21.9082 13.7725L7.00002 13.7725" stroke="currentColor" />
    </svg>
  );
}
