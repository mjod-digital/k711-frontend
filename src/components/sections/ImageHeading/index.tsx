import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./ImageHeading.module.scss";

type ImageHeadingProps = {
  image: string;
  imageAlt?: string;
  /** Затемнение фото (0–1), по умолчанию 0.3. */
  overlay?: number;
  /** Уникальный заголовок блока (см. GardenHeading / LobbyHeading). */
  children: ReactNode;
};

// Шелл: фото на всю ширину + затемнение + построчная шторка заголовка.
// Сам заголовок — уникальная разметка на блок (НЕ общий CascadeHeading).
export function ImageHeading({
  image,
  imageAlt = "",
  overlay = 0.3,
  children,
}: ImageHeadingProps) {
  return (
    <section className={styles.section}>
      <div className={styles.media}>
        <Image src={image} alt={imageAlt} fill sizes="100vw" className={styles.image} />
        <div
          className={styles.overlay}
          style={{ "--overlay": overlay } as CSSProperties}
          aria-hidden
        />
        <Reveal variant="lines" className={styles.headingWrap}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}
