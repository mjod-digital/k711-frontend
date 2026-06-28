"use client";

import Link from "next/link";
import { ru, type Apartment } from "@/lib/apartments";
import { FavoriteButton } from "@/components/ui/FavoriteButton";
import { useFavorites, useHydrated } from "@/store/favorites";
import styles from "./favorites.module.scss";

// Русское склонение: plural(1,'квартира','квартиры','квартир') → 'квартира'.
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

export function FavoritesList({ apartments }: { apartments: Apartment[] }) {
  const ids = useFavorites((s) => s.ids);
  const clear = useFavorites((s) => s.clear);
  const hydrated = useHydrated();

  // До гидратации localStorage — резервируем место, не мигаем пустотой.
  if (!hydrated) return <div className={styles.placeholder} aria-hidden="true" />;

  const items = apartments.filter((a) => ids.includes(a.id));

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>В избранном пока пусто.</p>
        <Link href="/apartments" className={styles.emptyCta}>
          перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.head}>
        <span className={styles.count}>
          {items.length} {plural(items.length, "квартира", "квартиры", "квартир")}
        </span>
        <button type="button" className={styles.clear} onClick={clear}>
          очистить
        </button>
      </div>

      <ul className={styles.list}>
        {items.map((a) => (
          <li key={a.id} className={styles.row}>
            <Link
              href={`/apartments/${a.id}`}
              className={styles.rowLink}
              aria-label={`Квартира №${a.id}`}
            />
            <span className={styles.num}>Квартира №{a.id}</span>
            <span className={styles.specs}>
              {a.floor} этаж · {a.bedrooms}{" "}
              {plural(a.bedrooms, "спальня", "спальни", "спален")} · {ru(a.area)} м²
            </span>
            <span className={styles.price}>{ru(Math.round(a.cost * 1_000_000))} ₽</span>
            <FavoriteButton
              id={a.id}
              className={styles.remove}
              activeClassName={styles.removeActive}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
