import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { fetchApartments, flatToDetail } from "@/lib/api";
import { FavoritesList } from "./FavoritesList";
import styles from "./favorites.module.scss";

export const metadata: Metadata = {
  title: "Избранное",
  description: "Сохранённые резиденции клубного дома k 7/11.",
};

export default async function FavoritesPage() {
  // Полный каталог нужен, чтобы по сохранённым id (localStorage) показать карточки.
  // flatToDetail даёт планировку (plan), № и полную стоимость — всё, что нужно карточке.
  const apartments = await fetchApartments()
    .then((flats) => flats.map(flatToDetail))
    .catch(() => []);

  return (
    <>
      <PageHero
        image="/images/favorites-hero.png"
        imageAlt="Резиденции клубного дома k 7/11"
        breadcrumb={[
          { label: "…", href: "/", ariaLabel: "Главная" },
          { label: "Избранное" },
        ]}
        aspectDesktop="1400 / 520"
        aspectMobile="344 / 350"
        heightDesktop={520}
        heightMobile={350}
      >
        <span className={`${styles.word} ${styles.rezidentsii} reveal-line`} style={{ "--i": 0 } as CSSProperties}>
          резиденции
        </span>{" "}
        <span className={`${styles.word} ${styles.vashej} reveal-line`} style={{ "--i": 1 } as CSSProperties}>
          вашей
        </span>{" "}
        <span className={`${styles.word} ${styles.mechty} reveal-line`} style={{ "--i": 2 } as CSSProperties}>
          мечты
        </span>
      </PageHero>

      <FavoritesList apartments={apartments} />
    </>
  );
}
