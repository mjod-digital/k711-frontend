import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./Surroundings.module.scss";

export function Surroundings() {
  return (
    <section className={styles.surroundings}>
      <Reveal as="h2" variant="lines" className={styles.title}>
        <span className={`${styles.line1} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
          в окружении
        </span>
        <span className={`${styles.line2} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
          любимых
        </span>
        <span className={`${styles.line3} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
          музеев и ресторанов
        </span>
      </Reveal>
    </section>
  );
}
