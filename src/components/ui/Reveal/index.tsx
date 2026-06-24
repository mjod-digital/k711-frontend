"use client";

import { useRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "@/lib/useIsomorphicLayoutEffect";
import { cn } from "@/lib/utils";
import styles from "./Reveal.module.scss";

type Direction = "up" | "down" | "left" | "right";
type Variant = "clip" | "panel" | "lines";

export type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Тег внутреннего (анимируемого) элемента: div, h2, ul… По умолчанию div. */
  as?: ElementType;
  /** Задержка в мс — для каскадного появления соседних Reveal. */
  delay?: number;
  /** Направление «шторки». По умолчанию up (поднимается снизу вверх). */
  direction?: Direction;
  /** Длительность в мс (override CSS-переменной, по умолчанию 720). */
  duration?: number;
  /** clip — clip-path wipe всего блока (default); panel — кремовая шторка;
   *  lines — построчная каскадная шторка (дети с классом `reveal-line` + style `--i`). */
  variant?: Variant;
  /** Цвет шторки (только variant="panel"); по умолчанию var(--color-badge-light). */
  panelColor?: string;
  /** true — сыграть один раз; false — переигрывать при каждом входе в вид. По умолчанию true. */
  once?: boolean;
  /** rootMargin для IO. По умолчанию запуск ближе к центру; можно переопределить
   *  на секцию (напр. Scenario — чуть раньше). */
  rootMargin?: string;
};

export function Reveal({
  children,
  className,
  as: Inner = "div",
  delay = 0,
  direction = "up",
  duration,
  variant = "clip",
  panelColor,
  once = true,
  rootMargin,
}: RevealProps) {
  // ВАЖНО: IntersectionObserver наблюдает за ВНЕШНЕЙ обёрткой (.reveal), которая
  // НЕ клипается. Если наблюдать за самим клипнутым элементом, clip-path обнуляет
  // площадь пересечения → observer никогда не срабатывает и контент не появляется.
  const hostRef = useRef<HTMLDivElement>(null);
  const isLines = variant === "lines";

  useIsomorphicLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Block/panel: clip-path на наблюдаемом узле обнуляет площадь IO → наблюдаем
    // за ВНЕШНЕЙ обёрткой. Lines: контейнер НЕ клипается (клипаются строки) и имеет
    // высоту даже при position:absolute → data-reveal/наблюдение вешаем на него.
    const el = (isLines ? host.firstElementChild : host) as HTMLElement | null;
    if (!el) return;

    // Reduced-motion: не вооружаем — контент остаётся полностью видимым.
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    // По умолчанию запуск ближе к центру (десктоп). На мобилке — чуть раньше
    // (нижние 15% вместо 35%). Явно переданный rootMargin приоритетнее.
    const isMobile = window.matchMedia("(max-width: 767.98px)").matches;
    const effectiveRootMargin =
      rootMargin ?? (isMobile ? "0px 0px -15% 0px" : "0px 0px -35% 0px");

    el.style.setProperty("--reveal-delay", `${delay}ms`);
    if (duration) el.style.setProperty("--reveal-duration", `${duration}ms`);

    // Вооружаем синхронно до первой отрисовки — без вспышки.
    el.dataset.reveal = "hidden";

    const io = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "visible";
          if (once) obs.disconnect();
        } else if (!once) {
          // Переигрываемый режим: ушли из вида — снова прячем под шторку.
          el.dataset.reveal = "hidden";
        }
      },
      { threshold: 0.2, rootMargin: effectiveRootMargin },
    );
    io.observe(el);

    return () => io.disconnect();
  }, [delay, duration, once, isLines, rootMargin]);

  const style = panelColor
    ? ({ "--reveal-panel-color": panelColor } as CSSProperties)
    : undefined;

  const innerClass = isLines
    ? className
    : cn(styles[variant], styles[direction], className);

  return (
    <div ref={hostRef} className={styles.reveal} style={style}>
      {variant === "panel" ? (
        <Inner className={innerClass}>
          <span className={styles.content}>{children}</span>
          <span className={styles.sheet} aria-hidden="true" />
        </Inner>
      ) : (
        <Inner className={innerClass}>{children}</Inner>
      )}
    </div>
  );
}
