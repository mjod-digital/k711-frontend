import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { PageHero } from "@/components/sections/PageHero";
import { CatalogUnavailable } from "@/components/sections/CatalogUnavailable";
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
  // При сбое источника список НЕ рендерим: без каталога он сказал бы «в избранном
  // пока пусто», и покупатель решил бы, что его подборка потерялась (DATA-005).
  const result = await fetchApartments();

  return (
    <>
      <PageHero
        image="/images/favorites-hero.webp"
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

      {result.ok ? (
        <FavoritesList apartments={result.flats.map(flatToDetail)} />
      ) : (
        <CatalogUnavailable title="избранное временно недоступно" />
      )}
    </>
  );
}
