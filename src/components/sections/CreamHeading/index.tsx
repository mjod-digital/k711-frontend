import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./CreamHeading.module.scss";

// Уникальная разметка (не общий CascadeHeading): «перейти в режим / тихой пресни».
export function CreamHeading() {
  return (
    <section className={styles.section}>
      <Reveal variant="lines" className={styles.wrap}>
        <h2 className={styles.heading}>
          <span className={`${styles.l1} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
            перейти в режим
          </span>
          <span className={`${styles.l2} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
            <span className={styles.lg}>тихой</span>
            <span className={styles.big}>пресни</span>
          </span>
        </h2>
      </Reveal>
    </section>
  );
}
