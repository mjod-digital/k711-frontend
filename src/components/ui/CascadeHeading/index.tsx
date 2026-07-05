import type { CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./CascadeHeading.module.scss";

export type CascadePart = {
  text: ReactNode;
  big?: boolean;
  /** Выравнивание части по поперечной оси строки (напр. «который» — вниз). */
  alignSelf?: "start" | "end";
};
export type CascadeLine = {
  parts: CascadePart[];
  align?: "start" | "center" | "end" | "custom";
  /** Строка переносится на несколько визуальных строк (мягкий перенос на мобиле):
   *  раскрывать сверху вниз, чтобы визуальные строки шли в порядке чтения (1→2→3),
   *  а не 1→3→2 от единой шторки снизу-вверх. См. .reveal-line-down в globals. */
  revealDown?: boolean;
};

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
          className={cn(
            styles.line,
            styles[alignClass[line.align ?? "start"]],
            "reveal-line",
            line.revealDown && "reveal-line-down",
          )}
          style={{ "--i": i } as CSSProperties}
        >
          {line.parts.map((part, j) => (
            <span
              key={j}
              className={part.big ? styles.big : styles.lg}
              style={part.alignSelf ? { alignSelf: part.alignSelf } : undefined}
            >
              {part.text}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
