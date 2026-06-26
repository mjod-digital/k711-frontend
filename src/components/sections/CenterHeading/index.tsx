import { CascadeHeading, type CascadeLine } from "@/components/ui/CascadeHeading";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./CenterHeading.module.scss";

type CenterHeadingProps = {
  lines: CascadeLine[];
  tone?: "brown" | "white";
};

// Самостоятельный центрированный каскадный заголовок-секция
// (Figma 373-9279 «Выразительный облик / вне времени»). Переиспользуемый.
export function CenterHeading({ lines, tone = "brown" }: CenterHeadingProps) {
  return (
    <section className={styles.section}>
      <Reveal variant="lines" className={styles.wrap}>
        <CascadeHeading as="h2" lines={lines} tone={tone} className={styles.heading} />
      </Reveal>
    </section>
  );
}
