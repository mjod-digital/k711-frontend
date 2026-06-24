"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { CascadeHeading, type CascadeLine } from "@/components/ui/CascadeHeading";
import { CountUp } from "@/components/ui/CountUp";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./Showcase.module.scss";

export type ShowcaseStep = {
  image: string;
  imageAlt?: string;
  /** Шаг-счётчик («46 резиденций»): задать count + word. */
  count?: number;
  word?: string;
  /** Шаг с каскадным заголовком: задать lines. */
  lines?: CascadeLine[];
  /** Раскладка строк заголовка для мобайла (если отличается от десктопной). */
  linesMobile?: CascadeLine[];
  description: ReactNode;
  ctaLabel: string;
  ctaHref: string;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Residences + 2×FeatureScreen как ОДИН scroll-lock блок. Десктоп: секция
// «пинится», прогресс скролла НЕПРЕРЫВНО (scrubbed) ведёт каждый шаг. Мобайл/
// reduced-motion → стопка; на мобайле у картинок свой (центрированный) параллакс.
export function Showcase({ steps }: { steps: ShowcaseStep[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pinned, setPinned] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [active, setActive] = useState(-1);
  const activeRef = useRef(-1);

  // 1) Режим: пин (десктоп без reduced-motion) / стопка; + флаг мобайла.
  useIsomorphicLayoutEffect(() => {
    const mqlDesktop = window.matchMedia("(min-width: 768px)");
    const mqlReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => {
      setPinned(mqlDesktop.matches && !mqlReduce.matches);
      setMobile(!mqlDesktop.matches);
    };
    decide();
    mqlDesktop.addEventListener("change", decide);
    mqlReduce.addEventListener("change", decide);
    return () => {
      mqlDesktop.removeEventListener("change", decide);
      mqlReduce.removeEventListener("change", decide);
    };
  }, []);

  // 2) Десктоп — scrubbed-прогресс по шагам. Мобайл — параллакс каждой картинки.
  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setStep = (
      el: HTMLDivElement | null,
      intro: number,
      introText: number,
      par: number,
    ) => {
      if (!el) return;
      el.style.setProperty("--intro", String(intro));
      el.style.setProperty("--introText", String(introText));
      el.style.setProperty("--par", String(par));
    };

    // ---- ДЕСКТОП: пин + скраб ----
    if (pinned) {
      const N = steps.length;
      let p = 0;
      let raf = 0;
      let ticking = false;

      // Первый шаг ВСЕГДА отрисован (без разворота) — у него только параллакс.
      const render = () => {
        const sf = p * N;
        const idx = Math.min(N - 1, Math.floor(sf));
        const sub = clamp01(sf - idx);
        for (let i = 0; i < N; i++) {
          if (i === 0) {
            setStep(stepRefs.current[0], 1, idx === 0 ? 1 : 0, clamp01(p * N));
          } else if (i < idx) {
            setStep(stepRefs.current[i], 1, 0, 1);
          } else if (i > idx) {
            setStep(stepRefs.current[i], 0, 0, 0);
          } else {
            setStep(
              stepRefs.current[i],
              clamp01(sub / 0.5),
              clamp01((sub - 0.12) / 0.4),
              clamp01((sub - 0.5) / 0.5),
            );
          }
        }
        return idx;
      };

      const tick = () => {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const armed = rect.top <= vh * 0.85 && rect.bottom > 0;
        const dist = section.offsetHeight - vh;
        const target = dist > 0 ? clamp01(-rect.top / dist) : 0;
        p += (target - p) * 0.085;
        const settled = Math.abs(target - p) < 0.0004;
        if (settled) p = target;
        const idx = render();
        const a = armed ? idx : -1;
        if (a !== activeRef.current) {
          activeRef.current = a;
          setActive(a);
        }
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
    }

    // ---- НЕ пин: сбрасываем скраб-состояние ----
    activeRef.current = -1;
    setActive(-1);
    stepRefs.current.forEach((el) => {
      el?.style.removeProperty("--intro");
      el?.style.removeProperty("--introText");
    });

    if (reduce) {
      stepRefs.current.forEach((el) => el?.style.removeProperty("--par"));
      return;
    }

    // ---- МОБАЙЛ: построчная шторка заголовков при входе в вид ----
    // На мобайле .textClip не клипает, поэтому каскадные заголовки оживляем
    // штатным механизмом [data-reveal] .reveal-line (CascadeHeading уже ставит
    // .reveal-line/--i). Счётчик-число анимируется отдельно (CountUp).
    const headings = stepRefs.current
      .map((el) => el?.querySelector("h2") as HTMLElement | null)
      .filter((h): h is HTMLElement => !!h);
    headings.forEach((h) => {
      h.dataset.reveal = "hidden";
    });
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.reveal = "visible";
            revealIO.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -20% 0px" },
    );
    headings.forEach((h) => revealIO.observe(h));

    // ---- МОБАЙЛ: у каждой картинки свой параллакс (центрированный -0.5..0.5) ----
    let raf = 0;
    const apply = () => {
      const vh = window.innerHeight || 1;
      stepRefs.current.forEach((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const progress = clamp01((vh - r.top) / (vh + r.height));
        el.style.setProperty("--par", String(0.5 - progress));
      });
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      revealIO.disconnect();
      headings.forEach((h) => {
        delete h.dataset.reveal;
      });
    };
  }, [pinned, steps.length]);

  const stateOf = (i: number) => {
    if (!pinned) return "flow";
    if (active < 0) return "future";
    if (i < active) return "past";
    if (i === active) return "active";
    return "future";
  };

  return (
    <section
      ref={sectionRef}
      className={cn(styles.section, pinned ? styles.pinned : styles.static)}
      style={{ "--steps": steps.length } as CSSProperties}
    >
      <div className={styles.stage}>
        {steps.map((step, i) => (
          <div
            key={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            className={styles.step}
            data-state={stateOf(i)}
          >
            <div className={styles.media}>
              <div className={styles.unfold}>
                <div className={styles.parallax}>
                  <Image
                    src={step.image}
                    alt={step.imageAlt ?? ""}
                    fill
                    sizes="(min-width: 768px) 49vw, 100vw"
                    className={styles.image}
                  />
                </div>
              </div>
            </div>

            <div className={styles.content}>
              <div className={styles.textClip}>
                {step.count != null ? (
                  <div className={styles.count}>
                    <CountUp
                      end={step.count}
                      className={styles.num}
                      play={pinned ? i === active : undefined}
                    />
                    <span className={styles.word}>{step.word}</span>
                  </div>
                ) : (
                  <CascadeHeading
                    lines={
                      (mobile && step.linesMobile ? step.linesMobile : step.lines) ?? []
                    }
                    className={styles.heading}
                  />
                )}

                <div className={styles.info}>
                  <p className={styles.desc}>{step.description}</p>
                  <Link href={step.ctaHref} className={styles.cta}>
                    {step.ctaLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
