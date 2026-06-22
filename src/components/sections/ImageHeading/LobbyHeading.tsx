import type { CSSProperties } from "react";
import styles from "./ImageHeading.module.scss";

// «Лобби / с потолками 5 метров» (Figma 373-10087): вторая строка — ряд,
// где «5» крупное (H1) между словами. Каждая строка — своя шторка.
export function LobbyHeading() {
  return (
    <h2 className={styles.lobbyHeading}>
      <span className={`${styles.lLine1} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
        лобби
      </span>
      <span className={`${styles.lLine2} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
        <span className={styles.lPre}>с потолками</span>
        <span className={styles.lNum}>5</span>
        <span className={styles.lPost}>метров</span>
      </span>
    </h2>
  );
}
