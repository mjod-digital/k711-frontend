import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./StayHeading.module.scss";

// Page-local заголовок /residences «дом, который не хочется покидать»
// (Figma 373-9529). Скаттер: «дом,» крупное (H1) слева, «который» (H2) правее-выше,
// «не хочется покидать» (H2) ниже. Не центрированный — поэтому отдельный компонент.
export function StayHeading() {
  return (
    <section className={styles.section}>
      <Reveal variant="lines" className={styles.wrap}>
        <h2 className={styles.heading}>
          <span className={`${styles.dom} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
            дом,
          </span>
          <span className={`${styles.kotoryy} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
            который
          </span>
          <span className={`${styles.neHochetsya} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
            не хочется покидать
          </span>
        </h2>
      </Reveal>
    </section>
  );
}
