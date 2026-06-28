import type { Metadata } from "next";
import Link from "next/link";
import { fetchApartments, flatToApartment } from "@/lib/api";
import { FavoritesList } from "./FavoritesList";
import styles from "./favorites.module.scss";

export const metadata: Metadata = {
  title: "Избранное",
  description: "Сохранённые резиденции клубного дома k 7/11.",
};

export default async function FavoritesPage() {
  // Полный каталог нужен, чтобы по сохранённым id (localStorage) показать данные.
  const apartments = await fetchApartments()
    .then((flats) => flats.map(flatToApartment))
    .catch(() => []);

  return (
    <section className={styles.wrap}>
      <nav className={styles.breadcrumb} aria-label="Хлебные крошки">
        <Link href="/" aria-label="Главная">
          …
        </Link>
        <span className={styles.sep} aria-hidden="true">
          /
        </span>
        <span aria-current="page">Избранное</span>
      </nav>

      <h1 className={styles.title}>Избранное</h1>

      <FavoritesList apartments={apartments} />
    </section>
  );
}
