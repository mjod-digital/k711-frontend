import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./ConnectBlock.module.scss";

type ConnectBlockProps = {
  href?: string;
  image?: string;
  imageAlt?: string;
};

// Тёмный CTA-баннер «Перейти к выбору резиденции» (Figma 373-9316).
// Переиспользуемый кросс-страничный блок; вся плашка — ссылка.
export function ConnectBlock({
  href = "/residences",
  image = "/images/arch-connect.png",
  imageAlt = "",
}: ConnectBlockProps) {
  return (
    <section className={styles.section}>
      <Link
        href={href}
        className={styles.banner}
        aria-label="Перейти к выбору резиденции"
      >
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(min-width: 768px) 96vw, 92vw"
          className={styles.image}
        />
        <span className={styles.scrim} aria-hidden="true" />

        {/* CTA-баннер, не заголовок раздела: текст дублирует aria-label ссылки,
            поэтому не выносим его в outline страницы (as="div", не h2). */}
        <Reveal variant="lines" as="div" className={styles.heading}>
          <span className="reveal-line" style={{ "--i": 0 } as CSSProperties}>
            Перейти
          </span>
          <span className="reveal-line" style={{ "--i": 1 } as CSSProperties}>
            к выбору
          </span>
          <span className={styles.lastLine}>
            <span className="reveal-line" style={{ "--i": 2 } as CSSProperties}>
              резиденции
            </span>
            <span className={styles.arrow} aria-hidden="true">
              <ArrowRight />
            </span>
          </span>
        </Reveal>
      </Link>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 24H47" stroke="currentColor" strokeWidth="2" />
      <path
        d="M28 3C28 14.5 37.5 24 48 24M28 45C28 33.5 37.5 24 48 24"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
