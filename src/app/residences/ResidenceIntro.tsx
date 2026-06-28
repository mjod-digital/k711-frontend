import { CascadeHeading } from "@/components/ui/CascadeHeading";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./ResidenceIntro.module.scss";

// Page-local второй блок /residences «резиденции с вашим сценарием жизни»
// (Figma 373-9515). Как TextDuo (правая колонка), но заголовок без крупного
// слова и ОДИН абзац (690) — поэтому отдельный компонент под страницу.
export function ResidenceIntro() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Reveal variant="lines" className={styles.headingWrap}>
          <CascadeHeading
            as="h2"
            className={styles.heading}
            lines={[
              { parts: [{ text: "резиденции" }] },
              { parts: [{ text: "с вашим сценарием" }] },
              { parts: [{ text: "жизни" }] },
            ]}
          />
        </Reveal>
        <p className={styles.paragraph}>
          Всего 46 резиденций — ни одной лишней, ни одной случайной. На этаже —
          от двух до четырёх квартир, что создаёт исключительную приватность,
          редкую даже для элитного сегмента.
        </p>
      </div>
    </section>
  );
}
