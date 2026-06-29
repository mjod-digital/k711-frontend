"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ru, type ApartmentDetail } from "@/lib/apartments";
import { useFavorites, useHydrated } from "@/store/favorites";
import styles from "./favorites.module.scss";

// Карточка квартиры в избранном: план (вписан) · характеристики · цена · действия.
function FavoriteCard({
  apt,
  onRemove,
}: {
  apt: ApartmentDetail;
  onRemove: () => void;
}) {
  const specs: [string, string][] = [
    ["Номер квартиры:", `№${apt.number}`],
    ["Кол-во спален:", `${apt.bedrooms}`],
    ["Этаж:", `${apt.floor}`],
    ["Площадь:", `${ru(apt.area)} м²`],
  ];

  return (
    <li className={styles.card}>
      <Link
        href={`/apartments/${apt.id}`}
        className={styles.plan}
        aria-label={`Квартира №${apt.number}`}
      >
        {apt.plan && (
          <Image
            src={apt.plan}
            alt={`Планировка квартиры №${apt.number}`}
            fill
            sizes="(max-width: 767.98px) 90vw, 24vw"
            className={styles.planImg}
          />
        )}
      </Link>

      <dl className={styles.specs}>
        {specs.map(([label, value]) => (
          <div key={label} className={styles.specRow}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <p className={styles.price}>{ru(apt.totalPrice)} ₽</p>

      <div className={styles.actions}>
        <button type="button" className={styles.delete} onClick={onRemove}>
          удалить
        </button>
        <Link href={`/apartments/${apt.id}`} className={styles.book}>
          забронировать
        </Link>
      </div>
    </li>
  );
}

export function FavoritesList({ apartments }: { apartments: ApartmentDetail[] }) {
  const ids = useFavorites((s) => s.ids);
  const remove = useFavorites((s) => s.remove);
  const hydrated = useHydrated();
  // Озвучка удаления для скринридера: фокус с кнопки исчезает вместе с карточкой,
  // поэтому объявляем из persistent live-региона, живущего вне списка.
  const [announcement, setAnnouncement] = useState("");

  // До гидратации localStorage — резервируем место, не мигаем пустотой.
  if (!hydrated) return <div className={styles.placeholder} aria-hidden="true" />;

  const items = apartments.filter((a) => ids.includes(a.id));

  const handleRemove = (apt: ApartmentDetail) => {
    remove(apt.id);
    setAnnouncement(`Квартира №${apt.number} удалена из избранного`);
  };

  return (
    <>
      <p
        className="visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </p>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>В избранном пока пусто.</p>
          <Link href="/apartments" className={styles.emptyCta}>
            перейти в каталог
          </Link>
        </div>
      ) : (
        <ul className={styles.grid}>
          {items.map((a) => (
            <FavoriteCard key={a.id} apt={a} onRemove={() => handleRemove(a)} />
          ))}
        </ul>
      )}
    </>
  );
}
