import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { Container } from "@/components/ui/Container";
import styles from "./Hero.module.scss";

export function Hero() {
  return (
    <Section>
      <Container>
        <div className={styles.inner}>
          <div className={styles.content}>
            <p className={styles.eyebrow}>Next.js · SCSS Modules · MODX</p>
            <h1 className={styles.title}>Резиновый лендинг от 360 до 1440</h1>
            <p className={styles.subtitle}>
              Каркас с fluid-типографикой на clamp() и двумя макетами —
              мобильным и десктопным. Контент приходит из MODX через API.
            </p>
            <div className={styles.actions}>
              <Link href="#" className={styles.primary}>
                Начать
              </Link>
              <Link href="#" className={styles.secondary}>
                Документация
              </Link>
            </div>
          </div>
          <div className={styles.media} aria-hidden="true" />
        </div>
      </Container>
    </Section>
  );
}
