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
      rTitle: number,
      rDesc: number,
      rCta: number,
      par: number,
      ph: number, // фаза текста: 0 — появление (клип сверху), 1 — уход (клип снизу)
    ) => {
      if (!el) return;
      el.style.setProperty("--intro", String(intro));
      el.style.setProperty("--rTitle", String(rTitle));
      el.style.setProperty("--rDesc", String(rDesc));
      el.style.setProperty("--rCta", String(rCta));
      el.style.setProperty("--par", String(par));
      el.style.setProperty("--ph", String(ph));
    };

    // ---- ДЕСКТОП: пин + скраб ----
    if (pinned) {
      const N = steps.length;
      let p = 0;
      let raf = 0;
      let ticking = false;

      // Картинка каждого шага «въезжает» шторкой снизу-вверх поверх предыдущего
      // (--intro). Текст шага РАСКРЫВАЕТСЯ ПОСТАДИЙНО снизу-вверх: картинка ведёт,
      // заголовок выезжает на середине картинки шторкой (--rTitle), за ним —
      // описание и кнопка, которые проявляются мягким «выездом» (opacity+сдвиг,
      // как абзацы Statement; --rDesc/--rCta). Уходящий шаг (idx-1) ИСЧЕЗАЕТ тоже
      // снизу-вверх (--ph=1: заголовок клипается снизу, текст гаснет), опережая
      // въезд следующего, чтобы тексты не накладывались.
      const HOLD = 0.1;
      const EXIT = 0.4; // уход текста завершается к sub=0.4 — до входа заголовка (0.45)
      // Стадии входа активного шага (по под-прогрессу sub 0..1).
      const stage = (sub: number) => ({
        title: clamp01((sub - 0.45) / 0.3), // заголовок — на середине картинки
        desc: clamp01((sub - 0.68) / 0.22), // описание — после заголовка
        cta: clamp01((sub - 0.9) / 0.1), // кнопка — когда картинка целиком встала
      });
      const render = () => {
        let idx: number;
        let sub: number;
        if (p <= HOLD) {
          idx = 0;
          sub = 0;
        } else {
          const seg = ((p - HOLD) / (1 - HOLD)) * (N - 1);
          idx = Math.min(N - 1, Math.floor(seg) + 1);
          sub = clamp01(seg - (idx - 1));
        }
        for (let i = 0; i < N; i++) {
          // --- Картинка (фоновый слой): счётчик и прошлые показаны, будущие скрыты ---
          let intro: number;
          if (i === 0 || i < idx) intro = 1;
          else if (i === idx) intro = sub; // активный въезжает шторкой
          else intro = 0;

          // --- Текст шага: появление (ph=0) / уход снизу-вверх (ph=1) ---
          let rTitle: number;
          let rDesc: number;
          let rCta: number;
          let ph = 0;
          if (idx === 0 && i === 0) {
            // вход счётчика: счётчик → desc → cta, последовательно снизу-вверх
            const e0 = clamp01(p / HOLD);
            rTitle = clamp01(e0 / 0.55);
            rDesc = clamp01((e0 - 0.45) / 0.3);
            rCta = clamp01((e0 - 0.75) / 0.25);
          } else if (i === idx) {
            // активный шаг — постадийное появление
            const s = stage(sub);
            rTitle = s.title;
            rDesc = s.desc;
            rCta = s.cta;
          } else if (i === idx - 1) {
            // уходящий шаг — исчезает снизу-вверх, опережая въезд следующего
            const vexit = 1 - clamp01(sub / EXIT);
            rTitle = vexit;
            rDesc = vexit;
            rCta = vexit;
            ph = 1;
          } else {
            // далёкое прошлое / будущее — скрыт
            rTitle = 0;
            rDesc = 0;
            rCta = 0;
          }

          const par = i === idx ? sub : i < idx ? 1 : 0; // (десктоп-параллакс не используется)
          setStep(stepRefs.current[i], intro, rTitle, rDesc, rCta, par, ph);
        }
        return idx;
      };

      const tick = () => {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const armed = rect.top <= vh * 0.85 && rect.bottom > 0;
        const dist = section.offsetHeight - vh;
        const target = dist > 0 ? clamp01(-rect.top / dist) : 0;
        p += (target - p) * 0.07; // плавнее (было 0.085)
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
      el?.style.removeProperty("--rTitle");
      el?.style.removeProperty("--rDesc");
      el?.style.removeProperty("--rCta");
      el?.style.removeProperty("--ph");
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
