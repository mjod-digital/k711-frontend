import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./DesignBureau.module.scss";

type DesignBureauProps = {
  image: string;
  imageAlt: string;
  ctaHref?: string;
  ctaLabel?: string;
};

// Блок об авторах концепции благоустройства (Figma 373-9364 / 397-10276):
// портрет дизайн-бюро, «разбросанный» заголовок «Авторы концепции
// благоустройства L.BURO», абзац о бюро и CTA. Десктоп — абсолютная раскладка
// в долях от артборда (резина держит пропорции). Мобайл — портрет+заголовок в
// .stage фиксированной пропорции, текст течёт под ним.
export function DesignBureau({
  image,
  imageAlt,
  ctaHref = "/residences",
  ctaLabel = "О дизайн-бюро",
}: DesignBureauProps) {
  return (
    <section className={styles.section}>
      <div className={styles.stage}>
        <div className={styles.photo}>
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 768px) 40vw, 59vw"
            className={styles.image}
          />
        </div>

        <Reveal variant="lines" as="h2" className={styles.heading}>
          <span className={`${styles.avtory} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
            Авторы
          </span>
          <span className={`${styles.koncepcii} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
            концепции
          </span>
          <span className={`${styles.blagoustroystva} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
            благоустройства
          </span>
          <span className={`${styles.lburo} reveal-line`} style={{ "--i": 3 } as CSSProperties}>
            L.BURO
          </span>
        </Reveal>
      </div>

      <div className={styles.body}>
        <p className={styles.para}>
          L.BURO рассматривают садовое искусство как способ организации жизни.
          Авторский метод студии — «Скандинавские сады» — соединяет нордическую
          сдержанность с петербургской традицией. Результат — лаконичные формы,
          выверенные пространства и среда для созерцания.
        </p>
        <Link href={ctaHref} className={styles.cta}>
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
