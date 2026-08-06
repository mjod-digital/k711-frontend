"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type Lenis from "lenis";
import type { ReactNode } from "react";
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

const RANGE_KEYS: readonly RangeKey[] = RANGE_PARAMS.map(([k]) => k);

type Ranges = ReturnType<typeof catalogRanges>;

// null = фильтр не задан. Отдельное «не задан» вместо «диапазон во всю ширину»
// нужно бейджам и URL: иначе нетронутый ползунок порождал бы бейдж и параметр
// в адресе для фильтра, который пользователь не выбирал. У спален ту же роль
// играет пустой массив: значений можно выбрать несколько (1 и 3).
type Filters = {
  bedrooms: number[];
  floor: Range | null;
  area: Range | null;
  pricePerM2: Range | null;
  cost: Range | null;
};

const EMPTY_FILTERS: Filters = {
  bedrooms: [],
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

// Спальни всегда держим отсортированными, поэтому поэлементного сравнения хватает.
const eqBeds = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const hasAny = (f: Filters) => f.bedrooms.length > 0 || RANGE_KEYS.some((k) => f[k]);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const filtersEqual = (a: Filters, b: Filters) =>
  eqBeds(a.bedrooms, b.bedrooms) && RANGE_KEYS.every((k) => eqRange(a[k], b[k]));

// Единственный предикат отбора: им фильтруется и таблица (applied), и счётчик на
// кнопке (draft). Две отдельные реализации — это способ разъехаться цифрам.
const matches = (a: Apartment, f: Filters) =>
  (f.bedrooms.length === 0 || f.bedrooms.includes(a.bedrooms)) &&
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
  if (f.bedrooms.length) p.set("beds", f.bedrooms.join(","));
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
  // beds=1,3 — несколько значений. Оставляем только существующие в каталоге и
  // убираем дубли, иначе битая ссылка родила бы бейдж «Спальни: 9».
  const rawBeds = p.get("beds");
  if (rawBeds) {
    const picked = [...new Set(rawBeds.split(",").map(Number))]
      .filter((n) => beds.includes(n))
      .sort((x, y) => x - y);
    if (picked.length) f = setKey(f, "bedrooms", picked);
  }
  for (const [key, name] of RANGE_PARAMS) {
    const raw = p.get(name);
    if (!raw) continue;
    // Ровно два числа через дефис. split("-") ломался на минусе: "-5-999" давал
    // ["","5","999"] → [0,5], истинные величины терялись и каталог опустошался
    // вырожденным фильтром. Регэксп со знаком разбирает границы однозначно, а
    // мусор («abc», «5-10-20») просто не матчится и параметр отбрасывается.
    const m = raw.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
    if (!m) continue;
    const lo = Number(m[1]);
    const hi = Number(m[2]);
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
  canReset,
  onBedrooms,
  onRange,
  onReset,
  onShow,
  onClose,
}: {
  draft: Filters;
  /** Полные границы каталога — ползунки всегда показывают их целиком. */
  ranges: Ranges;
  bedOptions: number[];
  /** Сколько лотов подходит под ЧЕРНОВИК (предпросмотр для кнопки «Показать N»). */
  count: number;
  /** Черновик разошёлся с применённым — подсвечиваем кнопку применения. */
  dirty: boolean;
  /** Есть что сбрасывать. Пусто — кнопку сброса не показываем вовсе. */
  canReset: boolean;
  onBedrooms: (n: number) => void;
  onRange: (key: RangeKey, v: Range) => void;
  onReset: () => void;
  onShow: () => void;
  onClose?: () => void;
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

  // «Резина по высоте» (десктоп-сайдбар): --fvw масштабирует контент по ШИРИНЕ, а колонка
  // фильтров — по высоте вьюпорта; на широких, но низких окнах контент бывает ВЫШЕ колонки →
  // теги/кнопки наезжали друг на друга и на ползунки. Масштабируем контент через zoom, чтобы
  // всё всегда влезало. Только когда реально не влезает; оверлей (onClose) — своя прокрутка,
  // не трогаем. Пересчёт: ресайз, смена брейкпоинта.
  const scaleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (onClose) return;
    const content = scaleRef.current;
    const box = content?.parentElement;
    if (!content || !box) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const fit = () => {
      content.style.zoom = "1";
      content.style.height = "auto";
      if (mq.matches) {
        const cs = getComputedStyle(box);
        const avail = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        const natural = content.offsetHeight;
        if (natural > avail && natural > 0) {
          content.style.zoom = String(avail / natural); // высота остаётся natural, zoom ужимает до avail
          return;
        }
      }
      // влезает (или мобайл) — без масштаба: CSS height:100% + гибкий зазор (.actions margin-top:auto)
      content.style.removeProperty("zoom");
      content.style.removeProperty("height");
    };
    fit();
    window.addEventListener("resize", fit);
    mq.addEventListener("change", fit);
    return () => {
      window.removeEventListener("resize", fit);
      mq.removeEventListener("change", fit);
    };
  }, [onClose]);

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

      <div className={styles.filtersScale} ref={scaleRef}>
      <div className={styles.filtersInner}>
        <div className={styles.bedGroup}>
          <p className={styles.bedLabel}>Количество спален</p>
          <div className={styles.tabs}>
            {bedOptions.map((n) => {
              const active = draft.bedrooms.includes(n);
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
      </div>

      {/* Блок кнопок прибит к низу панели (footer ВНЕ прокручиваемого .filtersInner):
          «Показать» всегда виден, а на низком окне прокручиваются ползунки, а не
          кнопки. */}
      <div className={styles.actions}>
        {/* Три состояния. Нулевое — комбинация невозможна, гасим (иначе кнопка
            предлагала бы «Показать 0 резиденций» и опустошила бы таблицу).
            Покой — применять нечего: кнопка отдыхает статус-строкой и не зовёт
            нажать себя впустую. Иначе — призыв применить черновик. */}
        <button
          type="button"
          className={cn(styles.showResults, idle && styles.showResultsIdle)}
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

        {/* Сбрасывать нечего — кнопки нет. В отличие от «Показать», ей нечего
            сообщить в покое, поэтому приглушённая она была бы просто мусором. */}
        {canReset && (
          <button type="button" className={styles.reset} onClick={onReset}>
            сбросить фильтры
          </button>
        )}
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

  // Множественный выбор: вкладка переключается независимо от остальных (1 и 3 —
  // валидный набор). Держим отсортированным — от него зависят и сравнение
  // черновика с применённым, и порядок в бейдже, и вид ссылки.
  const setBedrooms = (n: number) =>
    setDraft((d) =>
      setKey(
        d,
        "bedrooms",
        d.bedrooms.includes(n)
          ? d.bedrooms.filter((v) => v !== n)
          : [...d.bedrooms, n].sort((x, y) => x - y),
      ),
    );

  const sectionRef = useRef<HTMLElement>(null);
  const listScrollRef = useRef<HTMLDivElement>(null);
  const tbodyRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // «Показать» применяет черновик. Список ведётся прокруткой страницы (пин, см. эффект
  // ниже), поэтому «в начало» = вернуть страницу к старту пина (p=0): новую выборку видно
  // сверху, секция остаётся зафиксированной. Мобайл/reduced-motion (нет пина) — no-op.
  const apply = () => {
    setApplied(draft);
    const sec = sectionRef.current;
    if (!sec || !window.matchMedia("(min-width: 768px)").matches) return;
    const header = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const pinStartY = Math.max(0, sec.getBoundingClientRect().top + window.scrollY - header);
    const g = (window as Window & { __lenis?: Lenis }).__lenis;
    if (g) g.scrollTo(pinStartY, { immediate: true });
    else window.scrollTo(0, pinStartY);
  };

  // Пин секции + скролл списка от прокрутки страницы (десктоп) — как в галерее/Showcase.
  // .catalog — высокая обёртка (высоту ставит JS = экран−хедер + overflow списка), внутри
  // .catalogSticky липнет вверху (класс .pinned). Прогресс пина p (0→1) по rect.top ведёт
  // .list.scrollTop; дочитал список (p=1) — пин отпускает, страница идёт к футеру. Инерцию
  // даёт глобальный Lenis (страница). Кастомный скроллбар отражает p и тянется мышью
  // (двигает страницу). Мобайл/reduced-motion — без пина: список скроллится сам (см. SCSS).
  useEffect(() => {
    const section = sectionRef.current;
    const list = listScrollRef.current;
    const thumb = thumbRef.current;
    const track = thumb?.parentElement ?? null;
    if (!section || !list) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqDesktop = window.matchMedia("(min-width: 768px)");
    const active = () => mqDesktop.matches && !reduce.matches;

    let header = 0;
    let overflow = 0;
    let headH = 0;
    let trackH = 0;
    const measure = () => {
      if (!active()) {
        section.style.height = "";
        section.classList.remove(styles.pinned);
        overflow = 0;
        if (track) track.style.opacity = "0";
        return;
      }
      section.classList.add(styles.pinned);
      // Высота хедера = резолвнутое значение var(--header-h) (то же, что CSS-пин top).
      // getPropertyValue вернул бы fluid()-calc (не число), поэтому меряем сам <header>.
      header = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      overflow = Math.max(0, list.scrollHeight - list.clientHeight);
      // высокая обёртка: экран (минус хедер) + ход пина = overflow списка
      section.style.height = `${window.innerHeight - header + overflow}px`;
      const head = list.querySelector<HTMLElement>(`.${styles.listHead}`);
      headH = head ? head.offsetHeight : 0;
      if (track) {
        track.style.top = `${headH}px`; // трек под шапкой — скроллбар только у строк
        trackH = track.clientHeight;
      }
    };
    const tick = () => {
      if (!active()) return;
      if (overflow <= 0) {
        list.scrollTop = 0;
        if (track) track.style.opacity = "0";
        return;
      }
      // p: rect.top идёт от header (p=0, пин начался) до header−overflow (p=1, дочитан)
      const p = clamp01((header - section.getBoundingClientRect().top) / overflow);
      list.scrollTop = p * overflow;
      if (track && thumb) {
        track.style.opacity = "1";
        const thumbH = Math.max(24, ((list.clientHeight - headH) / (list.scrollHeight - headH)) * trackH);
        thumb.style.height = `${thumbH}px`;
        thumb.style.transform = `translateY(${p * (trackH - thumbH)}px)`;
      }
    };
    const refresh = () => {
      measure();
      tick();
    };

    refresh();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", refresh);
    mqDesktop.addEventListener("change", refresh);
    reduce.addEventListener("change", refresh);
    const ro = new ResizeObserver(refresh);
    ro.observe(list);
    if (tbodyRef.current) ro.observe(tbodyRef.current);

    // Перетаскивание thumb: позиция курсора в треке → доля пина → скролл СТРАНИЦЫ (список
    // ведётся страницей). Через глобальный Lenis (immediate).
    let dragging = false;
    const applyDrag = (clientY: number) => {
      if (!track || !thumb || overflow <= 0) return;
      const r = track.getBoundingClientRect();
      const thumbH = thumb.offsetHeight;
      const frac = clamp01((clientY - r.top - thumbH / 2) / Math.max(1, r.height - thumbH));
      const pinStartY = section.getBoundingClientRect().top + window.scrollY - header;
      const targetY = Math.max(0, pinStartY + frac * overflow);
      const g = (window as Window & { __lenis?: Lenis }).__lenis;
      if (g) g.scrollTo(targetY, { immediate: true });
      else window.scrollTo(0, targetY);
    };
    const onMove = (e: PointerEvent) => {
      if (dragging) applyDrag(e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      try {
        thumb?.releasePointerCapture(e.pointerId);
      } catch {}
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      thumb?.setPointerCapture(e.pointerId);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      applyDrag(e.clientY);
      e.preventDefault();
    };
    thumb?.addEventListener("pointerdown", onDown);

    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", refresh);
      mqDesktop.removeEventListener("change", refresh);
      reduce.removeEventListener("change", refresh);
      ro.disconnect();
      thumb?.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      section.style.height = "";
    };
  }, []);

  // «Сбросить фильтры» — единственное исключение из «применяет только Показать»:
  // чистит и черновик, и таблицу сразу. Осознанно: сброс — не подбор фильтра, а
  // выход из него, и требовать после него ещё клик по «Показать» — лишний шаг.
  // Обслуживает и аварийный сброс из пустого состояния.
  const resetAll = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };

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

  const rows = useMemo(
    () => apartments.filter((a) => matches(a, applied)),
    [apartments, applied],
  );
  const previewCount = useMemo(
    () => apartments.filter((a) => matches(a, draft)).length,
    [apartments, draft],
  );
  const dirty = !filtersEqual(draft, applied);
  // «Сбросить фильтры» чистит И черновик, И применённое (resetAll), поэтому показываем
  // кнопку, когда есть что сбрасывать в ЛЮБОМ из них. Иначе баг: применили фильтр (кнопка
  // появилась) → ведём ползунок обратно к границам → черновик становится пуст → кнопка
  // исчезала, хотя таблица ещё отфильтрована по applied. Сняли все бейджи крестиками (✕
  // чистит оба) → оба пусты → сбрасывать нечего, кнопки нет.
  const canReset = hasAny(draft) || hasAny(applied);

  // Мемоизируем сами элементы строк: applied не меняется, пока тянут ползунок,
  // а родитель при этом перерисовывается на каждый кадр.
  const body = useMemo(
    () =>
      rows.map((a) => (
        <ApartmentRow key={a.id} a={a} fav={hydrated && favSet.has(a.id)} onFav={toggleFav} />
      )),
    [rows, favSet, hydrated, toggleFav],
  );

  return (
    <section ref={sectionRef} className={styles.catalog}>
      <div className={styles.catalogSticky}>
      <aside className={styles.sidebar}>
        <FilterPanel
          draft={draft}
          ranges={ranges}
          bedOptions={bedOptions}
          count={previewCount}
          dirty={dirty}
          canReset={canReset}
          onBedrooms={setBedrooms}
          onRange={setRange}
          onReset={resetAll}
          onShow={apply}
        />
      </aside>

      <div className={styles.listPane}>
        <div className={styles.list} ref={listScrollRef}>
        {/* Шапка таблицы залипает под фикс-хедером — видна при любой прокрутке списка. */}
        <div className={styles.listHead}>
          <div className={styles.thead}>
            <span>Этаж</span>
            <span>Спальни</span>
            <span>Площадь</span>
            <span>Стоимость м²</span>
            <span>Стоимость</span>
            <span aria-hidden="true" />
          </div>
        </div>

        <div className={styles.tbody} ref={tbodyRef}>
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

        {/* Кастомный скроллбар списка (десктоп) — трек у правого края, под шапкой; thumb двигает JS. */}
        <div className={styles.scrollTrack} aria-hidden="true">
          <div className={styles.scrollThumb} ref={thumbRef} />
        </div>
      </div>
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
            canReset={canReset}
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
