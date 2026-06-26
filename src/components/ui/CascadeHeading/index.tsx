import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./CascadeHeading.module.scss";

export type CascadePart = { text: ReactNode; big?: boolean };
export type CascadeLine = { parts: CascadePart[]; align?: "start" | "center" | "end" | "custom" };

type CascadeHeadingProps = {
  /** Строки заголовка; в каждой — части (big = крупный H1, иначе lg = H2-шкала). */
  lines: CascadeLine[];
  tone?: "brown" | "white";
  as?: ElementType;
  className?: string;
};

const alignClass = { start: "alignStart", center: "alignCenter", end: "alignEnd", custom: "alignCustom" } as const;

export function CascadeHeading({
  lines,
  tone = "brown",
  as: Tag = "h2",
  className,
}: CascadeHeadingProps) {
  return (
    <Tag
      className={cn(
        styles.heading,
        tone === "white" ? styles.white : styles.brown,
        className,
      )}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          className={cn(styles.line, styles[alignClass[line.align ?? "start"]], "reveal-line")}
          style={{ "--i": i } as CSSProperties}
        >
          {line.parts.map((part, j) => (
            <span key={j} className={part.big ? styles.big : styles.lg}>
              {part.text}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
