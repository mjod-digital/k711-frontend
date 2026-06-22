"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Hero.module.scss";

export function Hero() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

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
          <Image
            src="/images/hero.jpg"
            alt="Клубный дом k711 на тихой Пресне"
            fill
            priority
            sizes="100vw"
            className={styles.image}
          />
        </div>

        <div className={styles.overlay}>
          <Reveal as="h1" variant="lines" className={styles.title}>
            <span className="reveal-line" style={{ "--i": 0 } as CSSProperties}>
              Клубный дом
            </span>
            <span className="reveal-line" style={{ "--i": 1 } as CSSProperties}>
              на тихой пресне
            </span>
          </Reveal>

          <Link href={siteConfig.cta.href} className={styles.cta}>
            {siteConfig.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
