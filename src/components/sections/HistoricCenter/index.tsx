import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./HistoricCenter.module.scss";

export function HistoricCenter() {
  return (
    <section className={styles.historic}>
      <Reveal as="h2" variant="lines" className={styles.title}>
        <span className={`${styles.line1} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
          исторический
        </span>
        <span className={`${styles.line2} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
          центр москвы
        </span>
      </Reveal>
    </section>
  );
}
