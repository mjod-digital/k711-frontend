"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import { RangeSlider } from "@/components/ui/RangeSlider";
import {
  bedroomOptions,
  catalogRanges,
  ru,
  type Apartment,
  type Range,
} from "@/lib/apartments";
import { useFavorites, useHydrated } from "@/store/favorites";
import { cn } from "@/lib/utils";
import styles from "./ApartmentCatalog.module.scss";

type Ranges = ReturnType<typeof catalogRanges>;
type Filters = {
  bedrooms: number | null;
  floor: Range;
  area: Range;
  pricePerM2: Range;
  cost: Range;
};

const initialFilters = (r: Ranges): Filters => ({
  bedrooms: null,
  floor: [...r.floor],
  area: [...r.area],
  pricePerM2: [...r.pricePerM2],
  cost: [...r.cost],
});

const within = (v: number, [lo, hi]: Range) => v >= lo && v <= hi;

// ----- URL ↔ фильтры: shareable-ссылка на отфильтрованный каталог -----
// Пары [ключ фильтра, имя query-параметра]. Диапазон пишем в URL только если он
// сужен относительно полного — иначе адресная строка остаётся чистой.
const RANGE_PARAMS = [
  ["floor", "floor"],
  ["area", "area"],
  ["pricePerM2", "price"],
  ["cost", "cost"],
] as const;

function filtersToQuery(f: Filters, r: Ranges): string {
  const p = new URLSearchParams();
  if (f.bedrooms !== null) p.set("beds", String(f.bedrooms));
  for (const [key, name] of RANGE_PARAMS) {
    const [lo, hi] = f[key];
    const [flo, fhi] = r[key];
    if (lo !== flo || hi !== fhi) p.set(name, `${lo}-${hi}`);
  }
  return p.toString();
}

function parseFiltersFromQuery(search: string, r: Ranges, beds: number[]): Filters | null {
  const p = new URLSearchParams(search);
  if (![...p.keys()].length) return null; // нет параметров — фильтры не трогаем
  const f = initialFilters(r);
  const b = Number(p.get("beds"));
  if (p.has("beds") && beds.includes(b)) f.bedrooms = b;
  for (const [key, name] of RANGE_PARAMS) {
    const raw = p.get(name);
    if (!raw) continue;
    const [lo, hi] = raw.split("-").map(Number);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
    // Клампим в допустимый диапазон и упорядочиваем (защита от битых ссылок).
    const [flo, fhi] = r[key];
    const clamp = (v: number) => Math.min(fhi, Math.max(flo, v));
    f[key] = [clamp(Math.min(lo, hi)), clamp(Math.max(lo, hi))] as Range;
  }
  return f;
}

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
  ranges,
  bedOptions,
  onReset,
  onClose,
  panelRef,
}: {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  ranges: Ranges;
  bedOptions: number[];
  onReset: () => void;
  onClose?: () => void;
  panelRef?: RefObject<HTMLDivElement | null>;
}) {
  const slider = (key: "floor" | "area" | "pricePerM2" | "cost", label: ReactNode) => (
    <RangeSlider
      label={label}
      min={ranges[key][0]}
      max={ranges[key][1]}
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

      <div className={styles.filtersInner} ref={panelRef}>
        <div className={styles.bedGroup}>
        <p className={styles.bedLabel}>Количество спален</p>
        <div className={styles.tabs}>
          {bedOptions.map((n) => (
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
    </div>
  );
}

// ----- Строка/таблица -----
// memo: избранное — глобальный стор, но переключение одной квартиры не должно
// перерисовывать все 46+ строк. Пропы стабильны (примитивы + стабильный action),
// поэтому ре-рендерится только строка, у которой изменился `fav`.
const ApartmentRow = memo(function ApartmentRow({
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
      <span className={styles.cell}>{ru(a.pricePerM2 * 1000)}</span>
      <span className={styles.cell}>{ru(Math.round(a.cost * 1_000_000))}</span>
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
});

export function ApartmentCatalog({ apartments }: { apartments: Apartment[] }) {
  const ranges = useMemo(() => catalogRanges(apartments), [apartments]);
  const bedOptions = useMemo(() => bedroomOptions(apartments), [apartments]);

  const [filters, setFilters] = useState<Filters>(() => initialFilters(ranges));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ready, setReady] = useState(false); // URL-инициализация завершена

  // Избранное — глобально (zustand). До гидратации считаем пустым.
  const favIds = useFavorites((s) => s.ids);
  const toggleFav = useFavorites((s) => s.toggle);
  const hydrated = useHydrated();
  // O(1)-проверка избранного вместо .includes() на каждую строку; пересобирается
  // только при смене списка избранного. `fav` в строку уходит примитивом, а
  // toggleFav — стабильный action zustand, поэтому memo(ApartmentRow) работает.
  const favSet = useMemo(() => new Set(favIds), [favIds]);

  const reset = () => setFilters(initialFilters(ranges));

  // URL → фильтры (один раз при монтировании): открытие ссылки с query-параметрами
  // восстанавливает отфильтрованный список. На сервере window нет → стартуем с
  // дефолтов (совпадает с SSR, без hydration-mismatch), URL применяем после гидратации.
  // setState здесь — намеренная инициализация из browser-only источника (не каскад
  // ре-рендеров); ranges/bedOptions стабильны (из пропа apartments), читаем один раз.
  useEffect(() => {
    const parsed = parseFiltersFromQuery(window.location.search, ranges, bedOptions);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (parsed) setFilters(parsed);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Фильтры → URL (после инициализации): держим адресную строку в актуальном
  // состоянии через History API — без навигации и рефетча серверного компонента,
  // чтобы ссылку на отфильтрованный каталог можно было скопировать и открыть.
  useEffect(() => {
    if (!ready) return;
    const qs = filtersToQuery(filters, ranges);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [filters, ready, ranges]);

  // Десктоп: масштабируем панель фильтров под высоту окна (zoom, как в меню) —
  // на невысоких экранах панель ужимается целиком, а не срезается кнопка «сбросить».
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const content = panelRef.current;
    const wrapper = content?.parentElement; // .filters (sticky, max-height)
    if (!content || !wrapper) return;
    const mqMobile = window.matchMedia("(max-width: 767.98px)");

    const applyScale = () => {
      if (mqMobile.matches) {
        content.style.removeProperty("zoom");
        return;
      }
      content.style.setProperty("zoom", "1"); // сброс перед замером натуральной высоты
      const natural = content.offsetHeight;
      const cs = getComputedStyle(wrapper);
      const vpad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const avail = wrapper.clientHeight - vpad;
      const chrome = window.innerHeight - avail;
      const availFloor = Math.max(0, 600 - chrome); // пол: ниже — внутренний скролл
      const scale = Math.min(1, Math.max(avail, availFloor) / Math.max(1, natural));
      content.style.setProperty("zoom", String(scale));
    };

    applyScale();
    void document.fonts?.ready.then(applyScale); // пересчёт после загрузки шрифтов
    window.addEventListener("resize", applyScale);
    mqMobile.addEventListener("change", applyScale);
    return () => {
      window.removeEventListener("resize", applyScale);
      mqMobile.removeEventListener("change", applyScale);
      content.style.removeProperty("zoom");
    };
  }, []);

  const rows = useMemo(
    () =>
      apartments.filter(
        (a) =>
          (filters.bedrooms === null || a.bedrooms === filters.bedrooms) &&
          within(a.floor, filters.floor) &&
          within(a.area, filters.area) &&
          within(a.pricePerM2, filters.pricePerM2) &&
          within(a.cost, filters.cost),
      ),
    [apartments, filters],
  );

  return (
    <section className={styles.catalog}>
      <aside className={styles.sidebar}>
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          ranges={ranges}
          bedOptions={bedOptions}
          onReset={reset}
          panelRef={panelRef}
        />
      </aside>

      <div className={styles.list}>
        <div className={styles.thead}>
          <span className={styles.floor}>Этаж</span>
          <span className={styles.bed}>Спальни</span>
          <span>Площадь</span>
          <span>Стоимость м²</span>
          <span>Стоимость</span>
          <span aria-hidden="true" />
        </div>
        <div className={styles.tbody}>
          {rows.map((a) => (
            <ApartmentRow
              key={a.id}
              a={a}
              fav={hydrated && favSet.has(a.id)}
              onFav={toggleFav}
            />
          ))}
          {rows.length === 0 && (
            <p className={styles.empty}>Нет квартир по заданным параметрам</p>
          )}
        </div>

        {/* Мобайл: липкая «полка» с кнопкой «Фильтры» (Figma 399:13138).
            Градиент гасит строки, уезжающие под кнопку. Полка ЛЕЖИТ ВНУТРИ
            .list — тогда её sticky-контейнер сам список, и она останавливается
            в конце таблицы, а не уезжает в футер. Пока оверлей открыт —
            убираем целиком (в макете её нет). */}
        {!filtersOpen && (
          <div className={styles.filtersDock}>
            <button
              type="button"
              className={styles.filtersTrigger}
              onClick={() => setFiltersOpen(true)}
            >
              Фильтры
            </button>
          </div>
        )}
      </div>

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
            ranges={ranges}
            bedOptions={bedOptions}
            onReset={reset}
            onClose={() => setFiltersOpen(false)}
          />
        </div>
      </div>
    </section>
  );
}
