import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { ApartmentCatalog } from "@/components/sections/ApartmentCatalog";
import styles from "./apartments.module.scss";

export const metadata: Metadata = {
  title: "Каталог квартир",
  description:
    "Каталог резиденций клубного дома k 7/11 — подбор по числу спален, этажу, площади и стоимости.",
};

export default function ApartmentsPage() {
  return (
    <>
      <PageHero
        image="/images/apartments-hero.png"
        imageAlt="Каталог резиденций клубного дома k 7/11"
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Каталог квартир" },
        ]}
        aspectDesktop="1400 / 520"
        aspectMobile="344 / 350"
      >
        <span className={`${styles.word} ${styles.katalog} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
          каталог
        </span>
        <span className={`${styles.word} ${styles.vashih} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
          ваших
        </span>
        <span className={`${styles.word} ${styles.rezidentsiy} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
          резиденций
        </span>
      </PageHero>

      <ApartmentCatalog />
    </>
  );
}
