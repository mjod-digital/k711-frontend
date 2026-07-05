import type { ReactNode } from "react";
import { CascadeHeading } from "@/components/ui/CascadeHeading";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./GardenText.module.scss";

type GardenTextProps = { paragraphs?: [ReactNode, ReactNode] };

// Дефолт = текущий текст (fallback-first).
const DEFAULT_PARAGRAPHS: [ReactNode, ReactNode] = [
  "Закрытый двор клубного дома «Климашкина 7/11» — это камерное пространство, скрытое от города и полностью подчинённое идее приватного сада. Здесь архитектура уходит на второй план, уступая место ландшафту, свету и тишине.",
  "Внутренний двор спроектирован как цельная природная композиция, где каждый элемент работает на ощущение уединённого городского оазиса.",
];

// Page-local копия TextDuo (variant=right) для /improvement («Скандинавский
// сад в центре Москвы»): заголовок + два столбца в правой колонке. Тот же вид,
// что у общего TextDuo, но стили/контент здесь — можно менять под страницу.
export function GardenText({ paragraphs = DEFAULT_PARAGRAPHS }: GardenTextProps = {}) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Reveal variant="lines" className={styles.headingWrap}>
          <CascadeHeading
            as="h2"
            className={styles.heading}
            lines={[
              { parts: [{ text: "Скандинавский" }] },
              { parts: [{ text: "сад в центре Москвы" }] },
            ]}
          />
        </Reveal>
        <Reveal variant="fade" className={styles.body}>
          <p className={styles.paragraph}>{paragraphs[0]}</p>
          <p className={styles.paragraph}>{paragraphs[1]}</p>
        </Reveal>
      </div>
    </section>
  );
}
