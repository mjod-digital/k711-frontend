import { CascadeHeading, type CascadeLine } from "@/components/ui/CascadeHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import styles from "./CenterHeading.module.scss";

type CenterHeadingProps = {
  lines: CascadeLine[];
  tone?: "brown" | "white";
  /** Доп. класс на секцию — для постраничных отступов (напр. amenities). */
  className?: string;
};

// Самостоятельный центрированный каскадный заголовок-секция
// (Figma 373-9279 «Выразительный облик / вне времени»). Переиспользуемый.
export function CenterHeading({ lines, tone = "brown", className }: CenterHeadingProps) {
  return (
    <section className={cn(styles.section, className)}>
      <Reveal variant="lines" className={styles.wrap}>
        <CascadeHeading as="h2" lines={lines} tone={tone} className={styles.heading} />
      </Reveal>
    </section>
  );
}
