import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./SpaceSplit.module.scss";

type SpaceSplitProps = {
  image: string;
  imageAlt?: string;
  /** Заголовок: две строки (Figma 397-11237 «Пространство / по вашим правилам»). */
  headingLines: [string, string];
  /** Два абзаца текста справа. */
  paragraphs: [ReactNode, ReactNode];
};

// «Пространство по вашим правилам» (Figma 397-11233): крупный коричневый
// заголовок + вертикальное фото слева, два абзаца справа.
export function SpaceSplit({
  image,
  imageAlt = "",
  headingLines,
  paragraphs,
}: SpaceSplitProps) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Reveal variant="lines" className={styles.headingWrap}>
            <h2 className={styles.heading}>
              <span
                className={`${styles.hLine} reveal-line`}
                style={{ "--i": 0 } as CSSProperties}
              >
                {headingLines[0]}
              </span>
              <span
                className={`${styles.hLine} reveal-line`}
                style={{ "--i": 1 } as CSSProperties}
              >
                {headingLines[1]}
              </span>
            </h2>
          </Reveal>

          <div className={styles.media}>
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(min-width: 768px) 36vw, 60vw"
              className={styles.image}
            />
          </div>
        </div>

        <div className={styles.body}>
          <p className={styles.paragraph}>{paragraphs[0]}</p>
          <p className={styles.paragraph}>{paragraphs[1]}</p>
        </div>
      </div>
    </section>
  );
}
