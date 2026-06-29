"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./SpaceSplit.module.scss";

type SpaceSplitProps = {
  image: string;
  imageAlt?: string;
  /** Крупный заголовок (Figma 373-9556 «Пространство / по вашим / правилам»). */
  headingLines: string[];
  /** Два абзаца текста справа. */
  paragraphs: [ReactNode, ReactNode];
  /** Подпись CTA-кнопки под вторым абзацем. */
  ctaLabel?: string;
  ctaHref?: string;
};

// «Пространство по вашим правилам» (Figma 373-9556): крупный коричневый
// заголовок поверх верха фото слева, два абзаца справа + CTA-кнопка под вторым.
export function SpaceSplit({
  image,
  imageAlt = "",
  headingLines,
  paragraphs,
  ctaLabel = "выбрать резиденцию",
  ctaHref = "/apartments",
}: SpaceSplitProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLParagraphElement>(null);

  // Абзацы и CTA «выезжают» снизу при входе в вид (как в Author): p0 → p1 → CTA,
  // со стаггером. data-reveal ставим императивно на секцию — без мигания в SSR.
  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const trigger = triggerRef.current;
    if (!section || !trigger) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    section.dataset.reveal = "hidden";
    const mqMobile = window.matchMedia("(max-width: 767.98px)");
    let io: IntersectionObserver | null = null;
    const arm = () => {
      io?.disconnect();
      const margin = mqMobile.matches ? "0px 0px -10% 0px" : "0px 0px -20% 0px";
      io = new IntersectionObserver(
        ([entry], obs) => {
          if (entry.isIntersecting) {
            section.dataset.reveal = "visible";
            obs.disconnect();
          }
        },
        { threshold: 0.2, rootMargin: margin },
      );
      io.observe(trigger);
    };
    arm();
    mqMobile.addEventListener("change", arm);
    return () => {
      io?.disconnect();
      mqMobile.removeEventListener("change", arm);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <Reveal variant="lines" className={styles.headingWrap}>
        <h2 className={styles.heading}>
          {headingLines.map((line, i) => (
            <span
              key={i}
              className={`${styles.hLine} reveal-line`}
              style={{ "--i": i } as CSSProperties}
            >
              {line}
            </span>
          ))}
        </h2>
      </Reveal>

      <div className={styles.content}>
        <div className={styles.media}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 768px) 36vw, 90vw"
            className={styles.image}
          />
        </div>

        <div className={styles.body}>
          <p ref={triggerRef} className={styles.paragraph}>
            {paragraphs[0]}
          </p>
          <div className={styles.col2}>
            <p className={styles.paragraph}>{paragraphs[1]}</p>
            <Link href={ctaHref} className={styles.cta}>
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
