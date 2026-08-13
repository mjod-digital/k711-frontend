"use client";

import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { HeroImage } from "@/components/ui/HeroImage";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./PageHero.module.scss";
import { Button} from '@/components/ui/Button/button';
import { ROUTES_PATH } from '@/config/site';

export type Crumb = {
  label: string;
  href?: string;
  /** Доступное имя ссылки, если видимый label — сокращение (напр. «…» → «Главная»). */
  ariaLabel?: string;
};

type PageHeroProps = {
  image: string;
  /** Мобильное фото (опц.). Если не задано — на мобиле берётся десктопное. */
  imageMobile?: string;
  imageAlt: string;
  /** Хлебные крошки: «… / Архитектура». Последний элемент — текущая страница. */
  breadcrumb: Crumb[];
  /** Скаттер-заголовок: спаны с классом `reveal-line` + style `--i`, позиции
   *  задаёт модуль страницы (они абсолютно позиционируются внутри фото). */
  children: ReactNode;
  /** Пропорции фото (CSS aspect-ratio). По умолчанию 1400/720 (десктоп), 344/580 (мобайл). */
  aspectDesktop?: string;
  aspectMobile?: string;
  /** Высота фото из макета (px). На 1440+ замораживается (max-height) — фото
   *  тянется по ширине, но не растёт по высоте (как в макете 1920). По умолчанию
   *  720 (десктоп) / 580 (мобайл). aspect-ratio задаёт высоту ниже 1440. */
  heightDesktop?: number;
  heightMobile?: number;
};

// Хедер внутренних страниц: скруглённое фото с рамкой, хлебные крошки сверху,
// «разбросанный» заголовок поверх фото. Переиспользуется всеми внутренними
// страницами — уникален только сам заголовок (передаётся как children).
export function PageHero({
  image,
  imageMobile,
  imageAlt,
  breadcrumb,
  children,
  aspectDesktop,
  aspectMobile,
  heightDesktop,
  heightMobile,
}: PageHeroProps) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Заголовок первого экрана раскрываем СРАЗУ на загрузке (это первый экран), а не
  // по «весь h1 в кадре»: иначе на невысоких экранах низ h1 за фолдом → заголовок
  // появляется только после скролла. Ждём сигнал прелоудера, чтобы шторка не
  // отыграла «вслепую» под ним; при клиентской навигации прелоудера уже нет
  // (__preloaderDone) → раскрываем немедленно. Страховка — таймаут.
  const [revealed, setRevealed] = useState(false);
  useIsomorphicLayoutEffect(() => {
    const w = window as Window & { __preloaderDone?: boolean };
    if (w.__preloaderDone) {
      setRevealed(true);
      return;
    }
    const onDone = () => setRevealed(true);
    window.addEventListener("preloader:done", onDone, { once: true });
    const fallback = window.setTimeout(() => setRevealed(true), 12000);
    return () => {
      window.removeEventListener("preloader:done", onDone);
      window.clearTimeout(fallback);
    };
  }, []);

  // Лёгкий параллакс фото при скролле (как в Hero главной).
  useIsomorphicLayoutEffect(() => {
    const media = mediaRef.current;
    const layer = parallaxRef.current;
    if (!media || !layer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = media.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
        layer.style.setProperty("--py", `${(progress - 0.5) * 10}%`);
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

  return (
    <section className={styles.hero}>
      <Breadcrumb items={breadcrumb} />

      <div
        className={styles.media}
        ref={mediaRef}
        style={
          {
            "--hero-aspect": aspectDesktop,
            "--hero-aspect-mobile": aspectMobile,
            "--hero-h": heightDesktop,
            "--hero-h-mobile": heightMobile,
          } as CSSProperties
        }
      >
        <Button
          className={styles.btnGenplan}
          url={ROUTES_PATH.genplan}
        >
          Визуальный выбор
        </Button>

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
            // Первый экран: ведём шторку извне (active) — раскрываем на загрузке по
            // сигналу прелоудера, а не по «весь h1 в кадре» (тот прятал заголовок
            // на невысоких экранах до скролла).
            active={revealed}
            className={styles.title}
          >
            {children}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
