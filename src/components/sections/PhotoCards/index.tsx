import Image from "next/image";
import { CascadeHeading, type CascadeLine } from "@/components/ui/CascadeHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import styles from "./PhotoCards.module.scss";

export type PhotoCard = {
  src: string;
  alt: string;
  /** Заголовок-подпись поверх фото (каскадная разметка). */
  lines: CascadeLine[];
  /** Позиция подписи: top (по умолчанию) или bottom. */
  position?: "top" | "bottom";
};

type PhotoCardsProps = {
  items: PhotoCard[];
};

// Пара фото-карточек с заголовком поверх (Figma 373-9288). Десктоп — две в ряд;
// мобайл — друг под другом «лесенкой» (первая прижата влево, вторая — вправо).
export function PhotoCards({ items }: PhotoCardsProps) {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {items.map((it, i) => {
          const bottom = it.position === "bottom";
          return (
            <figure
              key={i}
              className={cn(styles.card, bottom ? styles.bottom : styles.top)}
            >
              <Image
                src={it.src}
                alt={it.alt}
                fill
                sizes="(min-width: 768px) 48vw, 84vw"
                className={styles.image}
              />
              <figcaption className={styles.label}>
                <Reveal variant="lines">
                  <CascadeHeading as="div" tone="white" lines={it.lines} />
                </Reveal>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
