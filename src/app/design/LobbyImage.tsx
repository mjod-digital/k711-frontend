import Image from "next/image";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./LobbyImage.module.scss";

// Page-local блок /design (Figma 373-10224/10226): высокое фото лобби + белый
// каскадный заголовок «лесенкой» «лобби К7/11 — интерьерный манифест».
export function LobbyImage() {
  return (
    <section className={styles.section}>
      <div className={styles.media}>
        <Image
          src="/images/design/lobby.png"
          alt="Лобби клубного дома k 7/11 — интерьерный манифест"
          fill
          sizes="100vw"
          className={styles.image}
        />
        <div className={styles.overlay} aria-hidden />
        <Reveal variant="lines" className={styles.headingWrap}>
          <h2 className={styles.heading}>
            <span className={`${styles.line} ${styles.l1} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
              лобби К7/11 —
            </span>
            <span className={`${styles.line} ${styles.l2} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
              интерьерный
            </span>
            <span className={`${styles.line} ${styles.l3} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
              манифест
            </span>
          </h2>
        </Reveal>
      </div>
    </section>
  );
}
