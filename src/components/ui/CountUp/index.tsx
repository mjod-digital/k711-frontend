"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  end: number;
  /** мс, по умолчанию 1400 */
  duration?: number;
  className?: string;
  /** Контролируемый запуск: считать, когда станет true. Если не задан —
   *  запускается сам по IntersectionObserver (наблюдает ближайшую section). */
  play?: boolean;
};

// Считает 0 → end (easeOutCubic). reduced-motion → сразу конечное значение.
export function CountUp({ end, duration = 1400, className, play }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  const run = () => {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(end);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Контролируемый режим
  useEffect(() => {
    if (play) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  // Самостоятельный режим (play не задан) — по видимости ближайшей section.
  useEffect(() => {
    if (play !== undefined) return;
    const el = ref.current;
    if (!el) return;
    const target = el.closest("section") ?? el;
    const io = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          obs.disconnect();
          run();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(target);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
