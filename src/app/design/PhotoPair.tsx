import Image from "next/image";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./PhotoPair.module.scss";

type Photo = {
  src: string;
  alt: string;
  /** Маленькая подпись под фото (P2, brown-medium). */
  caption: string;
  /** Позиция в «лесенке» на мобайле: top (слева) / bottom (справа). */
  position?: "top" | "bottom";
};

// Page-local блок /design (Figma 373-10233 / 397-11494): пара фото с маленькой
// подписью ПОД снимком. Десктоп — две карточки в ряд по центру; мобайл — друг
// под другом «лесенкой» (первая прижата влево, вторая — вправо).
export function PhotoPair({ items }: { items: Photo[] }) {
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
              <Reveal className={styles.media}>
                <Image
                  src={it.src}
                  alt={it.alt}
                  fill
                  sizes="(min-width: 768px) 38vw, 84vw"
                  className={styles.image}
                />
              </Reveal>
              <figcaption className={styles.caption}>{it.caption}</figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
