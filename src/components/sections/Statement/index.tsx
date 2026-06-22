import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./Statement.module.scss";

export function Statement() {
  return (
    <section className={styles.statement}>
      <div className={styles.inner}>
        <Reveal as="h2" variant="lines" className={styles.heading}>
          <span className="reveal-line" style={{ "--i": 0 } as CSSProperties}>
            В центре
          </span>
          <span className="reveal-line" style={{ "--i": 1 } as CSSProperties}>
            культурной Москвы, вдали от шума
          </span>
        </Reveal>

        <Reveal className={styles.body} delay={120}>
          <p className={styles.paragraph}>
            Пресня — район, где Москва говорит вполголоса. Старомосковские улицы,
            тенистые аллеи, посольские особняки и тихие переулки сохраняют ритм
            города, в котором есть место паузе.
          </p>
          <p className={styles.paragraph}>
            k 7/11 встроен в эту ткань так, будто стоял здесь всегда — между
            историей и сегодняшним днём, между движением столицы и собственной
            тишиной.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
