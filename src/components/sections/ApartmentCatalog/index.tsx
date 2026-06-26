"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { RangeSlider } from "@/components/ui/RangeSlider";
import {
  APARTMENTS,
  BEDROOM_OPTIONS,
  FILTER_RANGES,
  ru,
  type Apartment,
} from "@/lib/apartments";
import { cn } from "@/lib/utils";
import styles from "./ApartmentCatalog.module.scss";

type Range = [number, number];
type Filters = {
  bedrooms: number | null;
  floor: Range;
  area: Range;
  pricePerM2: Range;
  cost: Range;
};

const initialFilters = (): Filters => ({
  bedrooms: null,
  floor: [...FILTER_RANGES.floor],
  area: [...FILTER_RANGES.area],
  pricePerM2: [...FILTER_RANGES.pricePerM2],
  cost: [...FILTER_RANGES.cost],
});

const within = (v: number, [lo, hi]: Range) => v >= lo && v <= hi;

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 20.3l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.54L12 20.3z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

// ----- Панель фильтров (общая: десктоп-сайдбар и мобильный оверлей) -----
function FilterPanel({
  filters,
  setFilters,
  onReset,
  onClose,
}: {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  onReset: () => void;
  onClose?: () => void;
}) {
  const slider = (key: "floor" | "area" | "pricePerM2" | "cost", label: ReactNode) => (
    <RangeSlider
      label={label}
      min={FILTER_RANGES[key][0]}
      max={FILTER_RANGES[key][1]}
      value={filters[key]}
      onChange={(v) => setFilters((f) => ({ ...f, [key]: v }))}
    />
  );

  return (
    <div className={styles.filters}>
      {onClose && (
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Закрыть фильтры"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      )}

      <div className={styles.bedGroup}>
        <p className={styles.bedLabel}>Количество спален</p>
        <div className={styles.tabs}>
          {BEDROOM_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={cn(styles.tab, filters.bedrooms === n && styles.tabActive)}
              aria-pressed={filters.bedrooms === n}
              onClick={() =>
                setFilters((f) => ({ ...f, bedrooms: f.bedrooms === n ? null : n }))
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {slider("floor", "Этаж")}
      {slider(
        "area",
        <>
          Площадь (м<sup>2</sup>)
        </>,
      )}
      {slider(
        "pricePerM2",
        <>
          Цена за 1 м<sup>2</sup> (тыс руб.)
        </>,
      )}
      {slider("cost", "Стоимость (млн руб.)")}

      <button type="button" className={styles.reset} onClick={onReset}>
        сбросить фильтры
      </button>
    </div>
  );
}

// ----- Строка/таблица -----
function ApartmentRow({
  a,
  fav,
  onFav,
}: {
  a: Apartment;
  fav: boolean;
  onFav: (id: string) => void;
}) {
  return (
    <div className={styles.row}>
      <Link
        href={`/apartments/${a.id}`}
        className={styles.rowLink}
        aria-label={`Квартира на ${a.floor} этаже, ${a.bedrooms} спальни, ${ru(a.area)} м²`}
      />
      <span className={cn(styles.cell, styles.floor)}>{a.floor}</span>
      <span className={cn(styles.cell, styles.bed)}>{a.bedrooms}</span>
      <span className={styles.cell}>{ru(a.area)} м²</span>
      <span className={styles.cell}>{ru(a.pricePerM2)} тыс</span>
      <span className={styles.cell}>{ru(a.cost * 1_000_000)}</span>
      <button
        type="button"
        className={cn(styles.fav, fav && styles.favActive)}
        aria-label={fav ? "Убрать из избранного" : "В избранное"}
        aria-pressed={fav}
        onClick={() => onFav(a.id)}
      >
        <HeartIcon />
      </button>
    </div>
  );
}

export function ApartmentCatalog() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const reset = () => setFilters(initialFilters());
  const toggleFav = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const rows = useMemo(
    () =>
      APARTMENTS.filter(
        (a) =>
          (filters.bedrooms === null || a.bedrooms === filters.bedrooms) &&
          within(a.floor, filters.floor) &&
          within(a.area, filters.area) &&
          within(a.pricePerM2, filters.pricePerM2) &&
          within(a.cost, filters.cost),
      ),
    [filters],
  );

  return (
    <section className={styles.catalog}>
      <aside className={styles.sidebar}>
        <FilterPanel filters={filters} setFilters={setFilters} onReset={reset} />
      </aside>

      <div className={styles.list}>
        <div className={styles.thead}>
          <span className={styles.floor}>Этаж</span>
          <span className={styles.bed}>Спальни</span>
          <span>площадь</span>
          <span>Стоимость м²</span>
          <span>стоимость</span>
          <span aria-hidden="true" />
        </div>
        <div className={styles.tbody}>
          {rows.map((a) => (
            <ApartmentRow key={a.id} a={a} fav={favorites.has(a.id)} onFav={toggleFav} />
          ))}
          {rows.length === 0 && (
            <p className={styles.empty}>Нет квартир по заданным параметрам</p>
          )}
        </div>
      </div>

      {/* Мобайл: кнопка «Фильтры» закреплена внизу экрана + выезжающий оверлей.
          Пока оверлей открыт — кнопку убираем (в макете её нет). */}
      {!filtersOpen && (
        <button
          type="button"
          className={styles.filtersTrigger}
          onClick={() => setFiltersOpen(true)}
        >
          Фильтры
        </button>
      )}

      <div
        className={cn(styles.overlay, filtersOpen && styles.overlayOpen)}
        aria-hidden={!filtersOpen}
      >
        <button
          type="button"
          className={styles.overlayBackdrop}
          aria-label="Закрыть фильтры"
          tabIndex={filtersOpen ? 0 : -1}
          onClick={() => setFiltersOpen(false)}
        />
        <div className={styles.overlayPanel}>
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            onReset={reset}
            onClose={() => setFiltersOpen(false)}
          />
        </div>
      </div>
    </section>
  );
}
