"use client";

import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import styles from "./Statement.module.scss";

// Абзацы редактируемы из CMS; дефолт = текущий текст (fallback-first).
const DEFAULT_PARAGRAPHS: [ReactNode, ReactNode] = [
  "Пресня — район, где Москва говорит вполголоса. Старомосковские улицы, тенистые аллеи, посольские особняки и тихие переулки сохраняют ритм города, в котором есть место паузе.",
  "k 7/11 встроен в эту ткань так, будто стоял здесь всегда — между историей и сегодняшним днём, между движением столицы и собственной тишиной.",
];

// Заголовок: по строке на визуальную строку (каждая — reveal-line). Редактируем из CMS.
const DEFAULT_HEADING = ["В центре", "культурной Москвы,", "вдали от шума"];

type StatementProps = {
  paragraphs?: [ReactNode, ReactNode];
  headingLines?: string[];
};

export function Statement({
  paragraphs = DEFAULT_PARAGRAPHS,
  headingLines = DEFAULT_HEADING,
}: StatementProps = {}) {
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
        {/* Каждая ВИЗУАЛЬНАЯ строка — отдельный reveal-line: иначе длинная вторая
            строка переносится и из-за шторки снизу-вверх её нижняя часть
            появляется раньше верхней (последовательность ломается 1→3→2). */}
        <Reveal as="h2" variant="lines" active={revealed} className={styles.heading}>
          {headingLines.map((line, i) => (
            <span key={i} className="reveal-line" style={{ "--i": i } as CSSProperties}>
              {line}
            </span>
          ))}
        </Reveal>

        {/* Абзацы — мягкий «выезд» снизу вверх (как тексты Elyse), от ТОГО ЖЕ
            триггера, что и заголовок. delay подобран так, чтобы абзацы
            подхватывали, пока заголовок ещё «доезжает» (expo-out раскрывает
            строки в первую треть) — без ощущения паузы после заголовка. */}
        <Reveal
          variant="fade"
          active={revealed}
          className={styles.body}
          delay={800}
          duration={1000}
        >
          <p className={styles.paragraph}>{paragraphs[0]}</p>
          <p className={styles.paragraph}>{paragraphs[1]}</p>
        </Reveal>
      </div>
    </section>
  );
}
