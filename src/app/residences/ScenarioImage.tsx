import Image from "next/image";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./ScenarioImage.module.scss";

// Page-local третий блок /residences (Figma 373-9518): высокое фото (1400×1233)
// + белый каскадный заголовок «лесенкой» в левом-нижнем углу. Похоже на Scenario,
// но фото выше и заголовок правовыровненной лесенкой — поэтому отдельный компонент.
export function ScenarioImage() {
  return (
    <section className={styles.section}>
      <div className={styles.media}>
        <Image
          src="/images/residences-scenario.png"
          alt="Интерьер резиденции — квартиры с вашим сценарием жизни"
          fill
          sizes="100vw"
          className={styles.image}
        />
        <div className={styles.overlay} aria-hidden />
        <Reveal variant="lines" className={styles.headingWrap}>
          <h2 className={styles.heading}>
            <span className={`${styles.line} ${styles.l1} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
              квартиры
            </span>
            <span className={`${styles.line} ${styles.l2} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
              с вашим
            </span>
            <span className={`${styles.line} ${styles.l3} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
              сценарием
            </span>
            <span className={`${styles.line} ${styles.l4} reveal-line`} style={{ "--i": 3 } as CSSProperties}>
              жизни
            </span>
          </h2>
        </Reveal>
      </div>
    </section>
  );
}
