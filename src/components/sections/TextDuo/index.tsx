import type { ReactNode } from "react";
import { CascadeHeading, type CascadeLine } from "@/components/ui/CascadeHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import styles from "./TextDuo.module.scss";

type TextDuoProps = {
  lines: CascadeLine[];
  paragraphs: [ReactNode, ReactNode];
  /** right — правая колонка (как Statement); full — заголовок и текст на всю ширину. */
  variant?: "right" | "full";
  /** Доп. класс на секцию (напр. переопределить --inner-mobile-width на странице). */
  className?: string;
};

export function TextDuo({ lines, paragraphs, variant = "right", className }: TextDuoProps) {
  return (
    <section className={cn(styles.section, variant === "full" ? styles.full : styles.right, className)}>
      <div className={styles.inner}>
        <Reveal variant="lines" className={styles.headingWrap}>
          <CascadeHeading as="h2" lines={lines} className={styles.heading} />
        </Reveal>
        <div className={styles.body}>
          <p className={styles.paragraph}>{paragraphs[0]}</p>
          <p className={styles.paragraph}>{paragraphs[1]}</p>
        </div>
      </div>
    </section>
  );
}
