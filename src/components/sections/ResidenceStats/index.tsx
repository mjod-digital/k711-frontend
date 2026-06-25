import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import styles from "./ResidenceStats.module.scss";

export type ResidenceStat = {
  src: string;
  alt: string;
  /** Крупное «число» (или «2-4», «до 157 м²») + строки подписи под ним. */
  value: ReactNode;
  caption: ReactNode;
  /** Позиция карточки в «лесенке»: left | center | right. */
  place?: "left" | "center" | "right";
};

type ResidenceStatsProps = {
  items: ResidenceStat[];
};

// Три фото-карточки со статистикой резиденций (Figma 397-11242).
// Заголовок-число + подпись «лежат» на фото снизу-слева; карточки —
// «лесенкой» (мобайл — друг под другом со сдвигом; десктоп — в ряд со сдвигом по вертикали).
export function ResidenceStats({ items }: ResidenceStatsProps) {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {items.map((it, i) => (
          <figure
            key={i}
            className={cn(styles.card, styles[it.place ?? "left"])}
          >
            <Image
              src={it.src}
              alt={it.alt}
              fill
              sizes="(min-width: 768px) 30vw, 83vw"
              className={styles.image}
            />
            <span className={styles.scrim} aria-hidden="true" />
            <figcaption className={styles.label}>
              <Reveal variant="lines">
                <span
                  className={`${styles.value} reveal-line`}
                  style={{ "--i": 0 } as CSSProperties}
                >
                  {it.value}
                </span>
                <span
                  className={`${styles.caption} reveal-line`}
                  style={{ "--i": 1 } as CSSProperties}
                >
                  {it.caption}
                </span>
              </Reveal>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
