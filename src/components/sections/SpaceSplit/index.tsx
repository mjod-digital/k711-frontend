import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./SpaceSplit.module.scss";

type SpaceSplitProps = {
  image: string;
  imageAlt?: string;
  /** Крупный заголовок (Figma 373-9556 «Пространство / по вашим / правилам»). */
  headingLines: string[];
  /** Два абзаца текста справа. */
  paragraphs: [ReactNode, ReactNode];
  /** Подпись CTA-кнопки под вторым абзацем. */
  ctaLabel?: string;
  ctaHref?: string;
};

// «Пространство по вашим правилам» (Figma 373-9556): крупный коричневый
// заголовок поверх верха фото слева, два абзаца справа + CTA-кнопка под вторым.
export function SpaceSplit({
  image,
  imageAlt = "",
  headingLines,
  paragraphs,
  ctaLabel = "выбрать резиденцию",
  ctaHref = "/apartments",
}: SpaceSplitProps) {
  return (
    <section className={styles.section}>
      <Reveal variant="lines" className={styles.headingWrap}>
        <h2 className={styles.heading}>
          {headingLines.map((line, i) => (
            <span
              key={i}
              className={`${styles.hLine} reveal-line`}
              style={{ "--i": i } as CSSProperties}
            >
              {line}
            </span>
          ))}
        </h2>
      </Reveal>

      <div className={styles.content}>
        <div className={styles.media}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 768px) 36vw, 90vw"
            className={styles.image}
          />
        </div>

        <div className={styles.body}>
          <p className={styles.paragraph}>{paragraphs[0]}</p>
          <div className={styles.col2}>
            <p className={styles.paragraph}>{paragraphs[1]}</p>
            <Link href={ctaHref} className={styles.cta}>
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
