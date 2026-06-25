"use client";

import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Statement.module.scss";

export function Statement() {
  const innerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  // ОДИН триггер на весь блок (как about-text-box у Elyse): когда блок входит в
  // вид — запускаем заголовок, а абзацы следом (через delay). Так абзацы НИКОГДА
  // не появляются раньше заголовка и не «ждут», пока доедут до центра экрана.
  useIsomorphicLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    const mqMobile = window.matchMedia("(max-width: 767.98px)");
    let io: IntersectionObserver | null = null;
    const arm = () => {
      io?.disconnect();
      const margin = mqMobile.matches ? "0px 0px -10% 0px" : "0px 0px -20% 0px";
      io = new IntersectionObserver(
        ([entry], obs) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            obs.disconnect();
          }
        },
        { threshold: 0.2, rootMargin: margin },
      );
      io.observe(el);
    };
    arm();
    mqMobile.addEventListener("change", arm);
    return () => {
      io?.disconnect();
      mqMobile.removeEventListener("change", arm);
    };
  }, []);

  return (
    <section className={styles.statement}>
      <div className={styles.inner} ref={innerRef}>
        <Reveal as="h2" variant="lines" active={revealed} className={styles.heading}>
          <span className="reveal-line" style={{ "--i": 0 } as CSSProperties}>
            В центре
          </span>
          <span className="reveal-line" style={{ "--i": 1 } as CSSProperties}>
            культурной Москвы, вдали от шума
          </span>
        </Reveal>

        {/* Абзацы — мягкий «выезд» снизу вверх (как тексты Elyse), от ТОГО ЖЕ
            триггера, что и заголовок. delay ≈ время анимации заголовка (2 строки:
            старт 2-й в +220мс + клип) → абзацы стартуют сразу ПОСЛЕ заголовка. */}
        <Reveal
          variant="fade"
          active={revealed}
          className={styles.body}
          delay={900}
          duration={1000}
        >
          <p className={styles.paragraph}>
            Пресня — район, где Москва говорит вполголоса. Старомосковские улицы,
            тенистые аллеи, посольские особняки и тихие переулки сохраняют ритм
            города, в котором есть место паузе.
          </p>
          <p className={styles.paragraph}>
            k 7/11 встроен в эту ткань так, будто стоял здесь всегда — между
            историей и сегодняшним днём, между движением столицы и собственной
            тишиной.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
