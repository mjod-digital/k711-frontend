import Image from "next/image";
import Link from "next/link";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/config/site";
import styles from "./Residences.module.scss";

export function Residences() {
  return (
    <section className={styles.residences}>
      <div className={styles.media}>
        <Image
          src="/images/residences.png"
          alt="Клубный дом k711 — 46 резиденций"
          fill
          sizes="(min-width: 768px) 49vw, 100vw"
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        <Reveal className={styles.count} delay={0}>
          <CountUp end={46} className={styles.num} />
          <span className={styles.word}>резиденций</span>
        </Reveal>

        <Reveal className={styles.info} delay={120}>
          <p className={styles.desc}>
            Истинно клубный дом.
            <br />
            От 2 до 4 квартир на этаже.
          </p>
          <Link href={siteConfig.cta.href} className={styles.cta}>
            {siteConfig.cta.label}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
