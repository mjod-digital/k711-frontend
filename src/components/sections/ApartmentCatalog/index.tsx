"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
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

// ----- URL ↔ фильтры: shareable-ссылка на отфильтрованный каталог -----
// Пары [ключ фильтра, имя query-параметра]. Диапазон пишем в URL только если он
// сужен относительно полного — иначе адресная строка остаётся чистой.
const RANGE_PARAMS = [
  ["floor", "floor"],
  ["area", "area"],
  ["pricePerM2", "price"],
  ["cost", "cost"],
] as const;

type RangeKey = (typeof RANGE_PARAMS)[number][0];
type FilterKey = "bedrooms" | RangeKey;

const RANGE_KEYS: readonly RangeKey[] = RANGE_PARAMS.map(([k]) => k);

type Ranges = ReturnType<typeof catalogRanges>;

// null = фильтр не задан. Отдельное «не задан» вместо «диапазон во всю ширину»
// нужно бейджам и URL: иначе нетронутый ползунок порождал бы бейдж и параметр
// в адресе для фильтра, который пользователь не выбирал.
type Filters = {
  bedrooms: number | null;
  floor: Range | null;
  area: Range | null;
  pricePerM2: Range | null;
  cost: Range | null;
};

const EMPTY_FILTERS: Filters = {
  bedrooms: null,
  floor: null,
  area: null,
  pricePerM2: null,
  cost: null,
};

// Типобезопасная запись по вычисляемому ключу: со спредом `{ ...f, [k]: v }`
// TS теряет связь ключа со значением и пропускает Range в bedrooms.
function setKey<K extends keyof Filters>(f: Filters, key: K, v: Filters[K]): Filters {
  const next = { ...f };
  next[key] = v;
  return next;
}

const within = (v: number, [lo, hi]: Range) => v >= lo && v <= hi;

const eqRange = (a: Range | null, b: Range | null) =>
  a === b || (!!a && !!b && a[0] === b[0] && a[1] === b[1]);

const filtersEqual = (a: Filters, b: Filters) =>
  a.bedrooms === b.bedrooms && RANGE_KEYS.every((k) => eqRange(a[k], b[k]));

// Единственный предикат отбора: им фильтруется и таблица (applied), и счётчик на
// кнопке (draft). Две отдельные реализации — это способ разъехаться цифрам.
const matches = (a: Apartment, f: Filters) =>
  (f.bedrooms === null || a.bedrooms === f.bedrooms) &&
  RANGE_KEYS.every((k) => {
    const r = f[k];
    return r === null || within(a[k], r);
  });

// Склонение слова «резиденция» по числу: 1 резиденцию, 2 резиденции, 5 резиденций.
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

function filtersToQuery(f: Filters, search: string): string {
  // Строим поверх существующих параметров: пересборка с нуля сносила из адресной
  // строки utm_source/gclid при первой же записи.
  const p = new URLSearchParams(search);
  p.delete("beds");
  for (const [, name] of RANGE_PARAMS) p.delete(name);
  if (f.bedrooms !== null) p.set("beds", String(f.bedrooms));
  for (const [key, name] of RANGE_PARAMS) {
    const v = f[key];
    if (v) p.set(name, `${v[0]}-${v[1]}`);
  }
  return p.toString();
}

function parseFiltersFromQuery(search: string, r: Ranges, beds: number[]): Filters | null {
  const p = new URLSearchParams(search);
  const owned = ["beds", ...RANGE_PARAMS.map(([, n]) => n)];
  if (!owned.some((n) => p.has(n))) return null; // чужие параметры — фильтры не трогаем
  let f: Filters = { ...EMPTY_FILTERS };
  const b = Number(p.get("beds"));
  if (p.has("beds") && beds.includes(b)) f = setKey(f, "bedrooms", b);
  for (const [key, name] of RANGE_PARAMS) {
    const raw = p.get(name);
    if (!raw) continue;
    const [lo, hi] = raw.split("-").map(Number);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
    // Клампим в допустимый диапазон и упорядочиваем (защита от битых ссылок).
    const [flo, fhi] = r[key];
    const clamp = (v: number) => Math.min(fhi, Math.max(flo, v));
    const span: Range = [clamp(Math.min(lo, hi)), clamp(Math.max(lo, hi))];
    // Диапазон во всю ширину ничего не отсекает — храним как null, иначе
    // ?floor=2-4 даёт бейдж для фильтра, который сам UI породить не смог бы.
    f = setKey(f, key, span[0] === flo && span[1] === fhi ? null : span);
  }
  return f;
}

// ----- Бейджи активных фильтров -----
const RANGE_LABELS: Record<RangeKey, string> = {
  floor: "Этаж",
  area: "Площадь",
  pricePerM2: "Цена за м²",
  cost: "Стоимость",
};
// Единицы — доменные (тыс/млн), как на подписях ползунков, а не как в ячейках
// таблицы (×1000 / ×1e6): бейдж должен читаться теми же цифрами, что и слайдер.
const RANGE_UNITS: Record<RangeKey, string> = {
  floor: "",
  area: " м²",
  pricePerM2: " тыс ₽",
  cost: " млн ₽",
};

// Один источник текста и для подписи, и для aria-label — чтобы доступное имя
// кнопки не разошлось с видимым.
const describe = (k: FilterKey, f: Filters): string => {
  if (k === "bedrooms") return `Спальни: ${f.bedrooms}`;
  const r = f[k];
  if (!r) return RANGE_LABELS[k];
  const [lo, hi] = r;
  const v = lo === hi ? ru(lo) : `${ru(lo)}–${ru(hi)}`; // en dash
  return `${RANGE_LABELS[k]}: ${v}${RANGE_UNITS[k]}`;
};

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
// Панель правит ТОЛЬКО черновик; в таблицу он уходит по кнопке «Показать».
function FilterPanel({
  draft,
  ranges,
  bedOptions,
  count,
  dirty,
  onBedrooms,
  onRange,
  onReset,
  onShow,
  onClose,
  panelRef,
}: {
  draft: Filters;
  /** Полные границы каталога — ползунки всегда показывают их целиком. */
  ranges: Ranges;
  bedOptions: number[];
  /** Сколько лотов подходит под ЧЕРНОВИК (предпросмотр для кнопки «Показать N»). */
  count: number;
  /** Черновик разошёлся с применённым — подсвечиваем кнопку применения. */
  dirty: boolean;
  onBedrooms: (n: number) => void;
  onRange: (key: RangeKey, v: Range) => void;
  onReset: () => void;
  onShow: () => void;
  onClose?: () => void;
  panelRef?: RefObject<HTMLDivElement | null>;
}) {
  const empty = count === 0;
  // Покой = применять нечего (черновик совпадает с применённым). Только на
  // десктопе: в мобильном оверлее эта же кнопка закрывает панель и ведёт к
  // списку, поэтому осмысленна всегда. onClose есть только у оверлея — по нему
  // и различаем, не заводя отдельного пропа.
  const idle = !dirty && !onClose;

  // Незаданный фильтр показываем как полный диапазон — ползунки «во всю ширину».
  const slider = (key: RangeKey, label: ReactNode) => (
    <RangeSlider
      label={label}
      min={ranges[key][0]}
      max={ranges[key][1]}
      value={draft[key] ?? ranges[key]}
      onChange={(v) => onRange(key, v)}
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
            {bedOptions.map((n) => {
              const active = draft.bedrooms === n;
              return (
                <button
                  key={n}
                  type="button"
                  className={cn(styles.tab, active && styles.tabActive)}
                  aria-pressed={active}
                  onClick={() => onBedrooms(n)}
                >
                  {n}
                </button>
              );
            })}
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

        {/* Кнопки коммита липнут к низу: панель может скроллиться внутри себя,
            а «Показать» — единственный способ применить фильтры. */}
        <div className={styles.actions}>
          <button type="button" className={styles.reset} onClick={onReset}>
            сбросить фильтры
          </button>

          {/* Три состояния. Нулевое — комбинация невозможна, гасим (иначе кнопка
              предлагала бы «Показать 0 резиденций» и опустошила бы таблицу).
              Покой — применять нечего: кнопка отдыхает статус-строкой и не зовёт
              нажать себя впустую. Иначе — призыв применить черновик. */}
          <button
            type="button"
            className={cn(
              styles.showResults,
              idle && styles.showResultsIdle,
              dirty && !empty && styles.showResultsDirty,
            )}
            disabled={empty || idle}
            onClick={onShow}
          >
            {empty
              ? "Нет подходящих резиденций"
              : idle
                ? // Согласование глагола: показанА 1, показанЫ 2, показанО 6.
                  `${plural(count, "Показана", "Показаны", "Показано")} ${count} ${plural(count, "резиденция", "резиденции", "резиденций")}`
                : `Показать ${count} ${plural(count, "резиденцию", "резиденции", "резиденций")}`}
          </button>
        </div>
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
      <span className={styles.cell}>{a.floor}</span>
      <span className={styles.cell}>{a.bedrooms}</span>
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

  // Два состояния: draft правит панель, applied — то, что уже применено и что
  // видно в таблице, бейджах и URL. Переход draft → applied только по «Показать».
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
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

  const setRange = (key: RangeKey, v: Range) =>
    setDraft((d) => {
      const [lo, hi] = ranges[key];
      // Дотянул до обоих краёв — фильтр ничего не отсекает, снимаем его совсем,
      // иначе он бы висел бейджем и параметром в URL, не сужая выборку.
      return setKey(d, key, v[0] === lo && v[1] === hi ? null : v);
    });

  const setBedrooms = (n: number) =>
    setDraft((d) => setKey(d, "bedrooms", d.bedrooms === n ? null : n));

  const apply = () => setApplied(draft);

  // Сброс чистит и черновик, и применённое: «сбросить» ничего не применяет, оно
  // снимает — как и крестик на бейдже, который тоже действует сразу. Иначе на
  // десктопе кнопка визуально не делала бы ничего.
  const resetAll = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

  // Крестик правит только ЧЕРНОВИК: бейдж — такой же орган ввода, как панель, и
  // тоже ничего не применяет. Единственная точка применения — «Показать».
  const removeFilter = (k: FilterKey) => setDraft((d) => setKey(d, k, null));

  // Синхронизация черновика с применённым — на обеих границах оверлея и только в
  // обработчиках: эффект по filtersOpen сработал бы и на закрытии. Без синхронизации
  // при отмене брошенный мобильный черновик пережил бы поворот экрана и всплыл
  // живым в десктопном сайдбаре, споря с бейджами и таблицей.
  const openFilters = () => {
    setDraft(applied);
    setFiltersOpen(true);
  };
  const cancelFilters = () => {
    setDraft(applied);
    setFiltersOpen(false);
  };

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelFilters();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersOpen, applied]);

  // URL → фильтры (один раз при монтировании): открытие ссылки с query-параметрами
  // восстанавливает отфильтрованный список. На сервере window нет → стартуем с
  // дефолтов (совпадает с SSR, без hydration-mismatch), URL применяем после гидратации.
  // setState здесь — намеренная инициализация из browser-only источника (не каскад
  // ре-рендеров); ranges/bedOptions стабильны (из пропа apartments), читаем один раз.
  useEffect(() => {
    const parsed = parseFiltersFromQuery(window.location.search, ranges, bedOptions);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (parsed) {
      // parseFiltersFromQuery уже зажал границы и обнулил диапазоны во всю ширину,
      // так что parse → query — неподвижная точка, доводить нечего.
      setApplied(parsed);
      setDraft(parsed);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Применённые фильтры → URL (после инициализации): держим адресную строку в
  // актуальном состоянии через History API — без навигации и рефетча серверного
  // компонента, чтобы ссылку на отфильтрованный каталог можно было скопировать.
  // Именно applied, не draft: иначе в адрес утекал бы каждый кадр перетаскивания
  // ползунка (WebKit душит replaceState после ~100 вызовов за 30 с).
  useEffect(() => {
    if (!ready) return;
    const qs = filtersToQuery(applied, window.location.search);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [applied, ready]);

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
      const availH = wrapper.clientHeight - vpad;
      const chrome = window.innerHeight - availH;
      const availFloor = Math.max(0, 600 - chrome); // пол: ниже — внутренний скролл
      const scale = Math.min(1, Math.max(availH, availFloor) / Math.max(1, natural));
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
    () => apartments.filter((a) => matches(a, applied)),
    [apartments, applied],
  );
  const previewCount = useMemo(
    () => apartments.filter((a) => matches(a, draft)).length,
    [apartments, draft],
  );
  const dirty = !filtersEqual(draft, applied);

  // Мемоизируем сами элементы строк: applied не меняется, пока тянут ползунок,
  // а родитель при этом перерисовывается на каждый кадр.
  const body = useMemo(
    () =>
      rows.map((a) => (
        <ApartmentRow key={a.id} a={a} fav={hydrated && favSet.has(a.id)} onFav={toggleFav} />
      )),
    [rows, favSet, hydrated, toggleFav],
  );

  // Бейджи читают ЧЕРНОВИК, а не применённое: крестик должен убирать чип сразу
  // (иначе клик выглядит как промах), но таблицу при этом не трогать. Так бейджи
  // показывают набор, который уйдёт в таблицу по «Показать».
  const badges = useMemo<FilterKey[]>(() => {
    const out: FilterKey[] = [];
    if (draft.bedrooms !== null) out.push("bedrooms");
    for (const k of RANGE_KEYS) if (draft[k]) out.push(k);
    return out;
  }, [draft]);

  return (
    <section className={styles.catalog}>
      <aside className={styles.sidebar}>
        <FilterPanel
          draft={draft}
          ranges={ranges}
          bedOptions={bedOptions}
          count={previewCount}
          dirty={dirty}
          onBedrooms={setBedrooms}
          onRange={setRange}
          onReset={resetAll}
          onShow={apply}
          panelRef={panelRef}
        />
      </aside>

      <div className={styles.list}>
        {badges.length > 0 && (
          <div className={styles.badges}>
            {badges.map((k) => {
              const text = describe(k, draft);
              return (
                <button
                  key={k}
                  type="button"
                  className={styles.badge}
                  onClick={() => removeFilter(k)}
                  aria-label={`Убрать фильтр: ${text}`}
                >
                  <span className={styles.badgeLabel}>{text}</span>
                  <span className={styles.badgeX} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.thead}>
          <span>Этаж</span>
          <span>Спальни</span>
          <span>Площадь</span>
          <span>Стоимость м²</span>
          <span>Стоимость</span>
          <span aria-hidden="true" />
        </div>
        <div className={styles.tbody}>
          {body}
          {rows.length === 0 && (
            <p className={styles.empty}>
              Нет резиденций с такими параметрами
              <button type="button" className={styles.emptyReset} onClick={resetAll}>
                сбросить фильтры
              </button>
            </p>
          )}
        </div>

        {/* Мобайл: липкая «полка» с кнопкой «Фильтры» (Figma 399:13138).
            Градиент гасит строки, уезжающие под кнопку. Полка ЛЕЖИТ ВНУТРИ
            .list — тогда её sticky-контейнер сам список, и она останавливается
            в конце таблицы, а не уезжает в футер. Пока оверлей открыт —
            убираем целиком (в макете её нет). */}
        {!filtersOpen && (
          <div className={styles.filtersDock}>
            <button type="button" className={styles.filtersTrigger} onClick={openFilters}>
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
          onClick={cancelFilters}
        />
        {/* inert: закрытый оверлей иначе оставляет ползунки в табуляции — с
            отложенным применением клавиатурный пользователь правил бы невидимый
            черновик. */}
        <div className={styles.overlayPanel} inert={!filtersOpen}>
          <FilterPanel
            draft={draft}
            ranges={ranges}
            bedOptions={bedOptions}
            count={previewCount}
            dirty={dirty}
            onBedrooms={setBedrooms}
            onRange={setRange}
            onReset={resetAll}
            onShow={() => {
              apply();
              setFiltersOpen(false);
            }}
            onClose={cancelFilters}
          />
        </div>
      </div>
    </section>
  );
}
