"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  /** Карусель на первом экране (редкий случай): первый слайд грузим сразу и
   *  приоритетно (loading="eager" + fetchPriority="high"). По умолчанию все
   *  слайды ленивые — см. eagerSlides ниже. */
  priority?: boolean;
};

export function Slider({
  slides,
  className,
  mobileGallery = false,
  priority = false,
}: SliderProps) {
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [mobileGalleryMode, setMobileGalleryMode] = useState(false);

  // Swiper loop при slidesPerView:auto + широких слайдах требует достаточно
  // слайдов, иначе соседи не выглядывают по краям и Swiper ругается «not enough
  // slides for loop». Дублируем набор до ≥6 — это та же бесконечная лента
  // (визуально неотличимо), но соседи выглядывают с ОБЕИХ сторон на любом слайде.
  const wantsLoop = slides.length > 2;
  const loopSlides = useMemo(
    () =>
      slides.length > 2 && slides.length < 6
        ? Array.from({ length: Math.ceil(6 / slides.length) }).flatMap(() => slides)
        : slides,
    [slides],
  );

  // Единственный слайд — листать некуда, стрелки только мешают.
  const showNav = slides.length > 1;

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

  // Картинки слайдов ленивые, пока карусель далеко. React выдаёт
  // <link rel="preload" as="image"> в <head> на КАЖДУЮ не-ленивую картинку
  // серверной разметки, поэтому eager у всех слайдов тянул кадры ниже первого
  // экрана наперегонки с картинкой первого экрана. Когда карусель подходит к
  // вьюпорту — переключаем слайды на eager: слайды за краем вьюпорта карусели
  // (и клоны loop) клипает overflow:hidden, нативный lazy их не грузит, и при
  // свайпе/доскролле они были бы пустыми.
  const [eagerSlides, setEagerSlides] = useState(false);
  useEffect(() => {
    if (eagerSlides) return;
    const el = viewportRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries, obs) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setEagerSlides(true);
        obs.disconnect();
      },
      // Экран запаса: к моменту появления карусели кадры уже загружены.
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eagerSlides]);

  // Дубли для loop показывают те же картинки, что и оригиналы. Если перевести
  // в eager оба <img> с одинаковым src, браузер уходит в сеть дважды (вторая
  // копия стартует до того, как придёт ответ по первой) — грузим каждый src
  // один раз, по первому вхождению. Дубль останется lazy и возьмёт картинку
  // из кэша, когда доедет до вьюпорта.
  const firstBySrc = useMemo(() => {
    const seen = new Set<string>();
    return loopSlides.map((s) => {
      if (seen.has(s.src)) return false;
      seen.add(s.src);
      return true;
    });
  }, [loopSlides]);

  // Приоритет (preload в <head>) — только у первого слайда и только если его
  // попросили пропом priority; остальные грузятся без preload.
  const slideLoading = (i: number) =>
    (priority && i === 0) || (eagerSlides && firstBySrc[i] !== false) ? "eager" : "lazy";
  const slideFetchPriority = (i: number) => (priority && i === 0 ? "high" : undefined);

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
        priority={priority}
        items={slides.map((s, i) => ({
          src: s.src,
          caption: s.caption,
          alt: s.alt,
          variant: i % 2 === 0 ? "wide" : "narrow",
        }))}
      />
    );
  }

  // Один слайд (напр. slider_spa) — листать некуда, а Swiper с loop только
  // дублирует единственную картинку и тянет лишний рантайм. Рендерим статичный
  // кадр в той же обёртке (те же классы → раскладка/стили не меняются): .swiper
  // даёт слайду ширину (.swiper .slide), .single центрирует его как centeredSlides,
  // swiper-slide-active проявляет подпись тем же правилом, что и у активного слайда.
  if (slides.length <= 1) {
    const slide = slides[0];
    return (
      <section className={cn(styles.slider, className)}>
        <div className={styles.viewport} ref={viewportRef}>
          {slide && (
            <div className={cn(styles.swiper, styles.single)}>
              <div className={cn(styles.slide, "swiper-slide-active")}>
                <div className={styles.imageBox}>
                  <div className={styles.parallax}>
                    <Image
                      src={slide.src}
                      alt={slide.alt ?? slide.caption ?? ""}
                      fill
                      loading={slideLoading(0)}
                      fetchPriority={slideFetchPriority(0)}
                      sizes="(min-width: 768px) 76vw, 86vw"
                      className={styles.image}
                    />
                  </div>
                </div>
                {slide.caption && <p className={styles.caption}>{slide.caption}</p>}
              </div>
            </div>
          )}
        </div>
      </section>
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
          loop={wantsLoop}
          loopAdditionalSlides={2}
          spaceBetween={spaceBetween}
          speed={700}
          className={styles.swiper}
        >
          {loopSlides.map((slide, i) => (
            <SwiperSlide key={i} className={styles.slide}>
              <div className={styles.imageBox}>
                <div className={styles.parallax}>
                  <Image
                    src={slide.src}
                    alt={slide.alt ?? slide.caption ?? ""}
                    fill
                    loading={slideLoading(i)}
                    fetchPriority={slideFetchPriority(i)}
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

        {showNav && (
          <>
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
          </>
        )}
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
