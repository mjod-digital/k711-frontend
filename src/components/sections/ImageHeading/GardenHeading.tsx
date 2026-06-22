import type { CSSProperties } from "react";
import styles from "./ImageHeading.module.scss";

// «Камерный / скандинавский / сад» (Figma 373-10074): лесенка вправо,
// «сад» — крупный (H1) у правого края. Каждая строка — своя шторка.
export function GardenHeading() {
  return (
    <h2 className={styles.gardenHeading}>
      <span className={`${styles.gLine1} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
        камерный
      </span>
      <span className={`${styles.gLine2} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
        скандинавский
      </span>
      <span className={`${styles.gLine3} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
        сад
      </span>
    </h2>
  );
}
