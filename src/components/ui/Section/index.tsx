import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./Section.module.scss";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn(styles.section, className)}>
      {children}
    </section>
  );
}
