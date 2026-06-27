import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./SilenceHeading.module.scss";

// Page-local секция /improvement «Пространство тишины и приватности».
// Вид как у CenterHeading, но БЕЗ общего CascadeHeading — вся разметка и стили
// заголовка лежат здесь, чтобы свободно менять под страницу.
export function SilenceHeading() {
  return (
    <section className={styles.section}>
      <Reveal variant="lines" className={styles.wrap}>
        <h2 className={styles.heading}>
          <span className={`${styles.line} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
            <span className={styles.lg}>Пространство</span>
          </span>
          <span className={`${styles.line} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
            <span className={styles.big}>тишины</span>
          </span>
          <span className={`${styles.line} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
            <span className={`${styles.lg} ${styles.privatnosti}`}>и приватности</span>
          </span>
        </h2>
      </Reveal>
    </section>
  );
}
