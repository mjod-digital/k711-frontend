import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./SilenceHeading.module.scss";

export type SilenceHeadingProps = {
  /** Три строки заголовка-лесенки: [верхняя (lg), средняя (big), нижняя (lg)]. */
  lines?: [string, string, string];
  /** Доп. класс на секцию (например, для отступов под конкретную страницу). */
  className?: string;
};

const DEFAULT_LINES: [string, string, string] = [
  "Пространство",
  "тишины",
  "и приватности",
];

// Каскадный заголовок-«лесенка» (центрирован на десктопе, на всю ширину на
// мобайле). Своя разметка/стили, независим от CascadeHeading. Используется на
// /improvement и /location — текст строк задаётся пропсом lines.
export function SilenceHeading({
  lines = DEFAULT_LINES,
  className,
}: SilenceHeadingProps) {
  const [top, mid, bottom] = lines;
  return (
    <section className={className ? `${styles.section} ${className}` : styles.section}>
      <Reveal variant="lines" className={styles.wrap}>
        <h2 className={styles.heading}>
          <span className={`${styles.line} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
            <span className={styles.lg}>{top}</span>
          </span>
          <span className={`${styles.line} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
            <span className={styles.big}>{mid}</span>
          </span>
          <span className={`${styles.line} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
            <span className={`${styles.lg} ${styles.lastLine}`}>{bottom}</span>
          </span>
        </h2>
      </Reveal>
    </section>
  );
}
