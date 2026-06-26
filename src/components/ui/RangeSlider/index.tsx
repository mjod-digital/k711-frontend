"use client";

import { useId } from "react";
import { ru } from "@/lib/apartments";
import styles from "./RangeSlider.module.scss";

type RangeSliderProps = {
  label: React.ReactNode;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
};

// Двухползунковый слайдер диапазона (макет 373-9604): тонкая дорожка, активный
// отрезок между ползунками, два круглых ползунка, под ним — мин/макс значения.
export function RangeSlider({ label, min, max, value, onChange, step = 1 }: RangeSliderProps) {
  const id = useId();
  const [lo, hi] = value;
  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;

  return (
    <div className={styles.group}>
      <p className={styles.label} id={id}>
        {label}
      </p>
      <div className={styles.slider}>
        <span className={styles.track} aria-hidden="true" />
        <span
          className={styles.fill}
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          className={styles.input}
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-labelledby={id}
          aria-label="Минимум"
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
        />
        <input
          type="range"
          className={styles.input}
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-labelledby={id}
          aria-label="Максимум"
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        />
      </div>
      <div className={styles.values}>
        <span>{ru(lo)}</span>
        <span>{ru(hi)}</span>
      </div>
    </div>
  );
}
