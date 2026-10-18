import {
  GENPLAN_VIEW_IDS,
  type Apartment,
  type ApartmentDetail,
  type ApartmentPolygon,
  type GenplanApartment,
  type GenplanViewId,
} from "./apartments";
import { MOCK_FLATS } from "./flats.mock";
import { safeUrl } from "./url";

// ============================================================
//   API клубного дома Климашкина 7/11.
//   id квартиры для /flat и роутинга — это поле `number` (уникальное).
// ============================================================
// База контент-API (MODX). Локально — http://localhost:8080/api (см. .env.local),
// на проде переменная не задана → продовый адрес.
const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://www.klimashkina711.ru/api";
const REVALIDATE_TIME = 60;
// Таймаут внешних запросов: подвисший MODX/CRM не должен блокировать SSR/ISR-рендер.
const FETCH_TIMEOUT_MS = 8000;

// Источник каталога квартир: "api" — живой CRM, "mock" — снимок в коде
// (src/lib/flats.mock.ts). На превью-деплое CRM не нужен: каталог собирается из
// снимка, без сетевых зависимостей. Переменную VERCEL платформа выставляет сама,
// поэтому превью переключается без ручной настройки.
// Прод и локальная разработка не меняются: ни APARTMENTS_SOURCE, ни VERCEL там нет → "api".
// Явный APARTMENTS_SOURCE перекрывает автоопределение в обе стороны.
const APARTMENTS_SOURCE =
  process.env.APARTMENTS_SOURCE ?? (process.env.VERCEL ? "mock" : "api");
const USE_MOCK_FLATS = APARTMENTS_SOURCE === "mock";

// Форма квартиры из CRM (/flats, /flat).
export type Flat = {
  name: string;
  number: string;
  floor: number;
  area: number;
  amount: number; // полная стоимость, ₽
  price: number; // цена за 1 м², ₽
  amountDiscount: number; // стоимость со скидкой, ₽
  areaProject: number;
  type: string;
  status: string; // Free | Sold …
  numberOfBedrooms: number;
  numberOfBathrooms: number | string;
  pdf: string;
  ceilingHeightM: number;
  viewFromWindowTypology: string | null;
  sectionNumber: string;
  tags?: string[];
  images?: Array<{
    src: string;
    alt: string;
  }>;
  layoutUrl: string; // планировка (внешний S3)
  floorPlan: string; // мини-план этажа (внешний S3)
  polygon: ApartmentPolygon[]; // фасадные контуры на стоп-ракурсах генплана
};

// ----- Валидация внешних данных (ARCH-004/DATA-003) -----
// CRM-ответ приходит нетипизированным JSON. Раньше он кастился в Flat[] «на веру»:
// одно кривое/пустое числовое поле (цена, площадь) давало NaN, который тихо протекал
// в карточки и ломал фильтры каталога. Валидируем на границе: поля, на которых стоит
// арифметика и фильтры, обязаны быть конечными числами — иначе строка отбрасывается
// (одна битая строка не стоит каталога с NaN-ценами; а вот полный провал разбора
// уводит уже на снимок, см. fetchApartments).

// DATA-004: но «конечное число» ≠ «пришло типом number». MODX — это PHP, а json_encode
// отдаёт DECIMAL/NUMERIC-колонки строками («50.20», «116464000»), и снип, собирающий
// фид конкатенацией или через getTVValue, тоже отдаёт строки. Прежняя проверка
// typeof v === "number" на таком фиде отбраковывала ВСЕ строки каталога — одно
// изменение на стороне CRM (правка снипета, INT → DECIMAL, апгрейд PHP) обнуляло сайт.
// Поэтому приводим: число берём как есть, строку — только непустую и только если она
// приводится к конечному числу. Запятая как десятичный разделитель и пробелы-разделители
// разрядов (включая NBSP и узкий пробел) — штатные варианты записи в CMS, их нормализуем.
// Проверку не ослабляем: NaN, Infinity, пустая строка и любой другой тип → null,
// а null в обязательном поле по-прежнему отбраковывает строку целиком.
function toFiniteNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const s = v.replace(/[\s  ]/g, "").replace(",", ".");
  if (!s) return null; // Number("") === 0 — пустую строку числом не считаем
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isGenplanViewId(value: unknown): value is GenplanViewId {
  return typeof value === "string" && GENPLAN_VIEW_IDS.includes(value as GenplanViewId);
}

function parseApartmentPolygons(value: unknown): ApartmentPolygon[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const polygon = item as Record<string, unknown>;
    if (
      !isGenplanViewId(polygon.viewId) ||
      typeof polygon.points !== "string"
    ) {
      return [];
    }

    return [
      {
        viewId: polygon.viewId,
        points: polygon.points,
      },
    ];
  });
}

function parseFlatImages(value: unknown): Flat["images"] {
  if (!Array.isArray(value)) return undefined;

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];

    const image = item as Record<string, unknown>;
    if (typeof image.src !== "string" || typeof image.alt !== "string") {
      return [];
    }

    return [{ src: image.src, alt: image.alt }];
  });
}

function toFlat(x: unknown): Flat | null {
  if (!x || typeof x !== "object") return null;
  const f = x as Record<string, unknown>;
  // number — идентификатор квартиры (роутинг + ключи): непустая строка.
  const number =
    typeof f.number === "string" ? f.number.trim() : String(f.number ?? "").trim();
  if (!number) return null;
  // Числовые поля, на которых держатся арифметика и фильтры.
  const floor = toFiniteNumber(f.floor);
  const area = toFiniteNumber(f.area);
  const amount = toFiniteNumber(f.amount);
  const price = toFiniteNumber(f.price);
  const numberOfBedrooms = toFiniteNumber(f.numberOfBedrooms);
  if (
    floor === null ||
    area === null ||
    amount === null ||
    price === null ||
    numberOfBedrooms === null
  ) {
    return null;
  }
  // numberOfBathrooms — единственное поле, где строка легальна сама по себе
  // («2 + гостевой»): число достаём, нечисловую строку сохраняем как есть.
  const numberOfBathrooms = toFiniteNumber(f.numberOfBathrooms);
  const amountDiscount = toFiniteNumber(f.amountDiscount);
  const areaProject = toFiniteNumber(f.areaProject);
  const ceilingHeightM = toFiniteNumber(f.ceilingHeightM);
  // Необязательные поля добиваем безопасными дефолтами.
  return {
    name: typeof f.name === "string" ? f.name : "",
    number,
    floor,
    area,
    amount,
    price,
    amountDiscount: amountDiscount ?? 0,
    areaProject: areaProject ?? area,
    type: typeof f.type === "string" ? f.type : "",
    status: typeof f.status === "string" ? f.status : "",
    numberOfBedrooms,
    numberOfBathrooms:
      numberOfBathrooms ??
      (typeof f.numberOfBathrooms === "string" ? f.numberOfBathrooms : ""),
    pdf: typeof f.pdf === "string" ? f.pdf : "",
    ceilingHeightM: ceilingHeightM ?? 0,
    viewFromWindowTypology:
      typeof f.viewFromWindowTypology === "string" ? f.viewFromWindowTypology : null,
    sectionNumber:
      typeof f.sectionNumber === "string"
        ? f.sectionNumber
        : String(f.sectionNumber ?? ""),
    tags: Array.isArray(f.tags)
      ? f.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined,
    images: parseFlatImages(f.images),
    layoutUrl: typeof f.layoutUrl === "string" ? f.layoutUrl : "",
    floorPlan: typeof f.floorPlan === "string" ? f.floorPlan : "",
    polygon: parseApartmentPolygons(f.polygon),
  };
}

// Массив из CRM → валидные Flat; битые строки отбрасываются с предупреждением в лог.
function parseFlats(raw: unknown): Flat[] {
  if (!Array.isArray(raw)) return [];
  const flats: Flat[] = [];
  for (const item of raw) {
    const flat = toFlat(item);
    if (flat) flats.push(flat);
  }
  const dropped = raw.length - flats.length;
  if (dropped > 0) {
    console.warn(`[api] отброшено ${dropped} из ${raw.length} квартир: невалидная форма`);
  }
  return flats;
}

// ----- Загрузка каталога: «источник недоступен» ≠ «ничего не найдено» (DATA-005) -----
// Раньше fetchApartments бросал, а все страницы ловили ошибку в пустой массив — сбой CRM
// выглядел как «нет квартир»: каталог пуст, избранное писало «пусто», генплан отдавал 404.
// Теперь результат самодостаточен: ok:false — источник недоступен (UI показывает «временно
// недоступно» с телефоном), ok:true + flats: [] — источник ответил, предложений нет.
// source говорит, живой это фид или снимок из кода, — нужен и логам, и будущему маркеру
// «данные актуальны на …» (DATA-023).
export type ApartmentsResult =
  | { ok: true; flats: Flat[]; source: "api" | "snapshot" }
  | { ok: false; reason: string };

// Причину сбоя пишем в лог текстом: без неё «каталог недоступен» в проде неотличим
// от таймаута, 502 и сломанного контракта.
function describeError(e: unknown): string {
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
}

export async function fetchApartments(): Promise<ApartmentsResult> {
  if (USE_MOCK_FLATS) return { ok: true, flats: MOCK_FLATS, source: "snapshot" };
  const url = `${API_BASE_URL}/flats`;
  let res: Response;
  try {
    res = await fetch(url, {
      next: { revalidate: REVALIDATE_TIME },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    // Сеть/DNS/таймаут AbortSignal — источника просто нет.
    console.error(`[api] каталог недоступен: ${url} — ${describeError(e)}`);
    return { ok: false, reason: "network" };
  }
  if (!res.ok) {
    console.error(`[api] каталог недоступен: ${url} — HTTP ${res.status}`);
    return { ok: false, reason: `http_${res.status}` };
  }
  let raw: unknown;
  try {
    raw = await res.json();
  } catch (e) {
    console.error(`[api] каталог недоступен: ${url} — тело не JSON: ${describeError(e)}`);
    return { ok: false, reason: "bad_json" };
  }
  if (!Array.isArray(raw)) {
    // Контракт сломан на уровне формы ответа — это сбой источника, а не пустой каталог.
    console.error(`[api] каталог недоступен: ${url} — ответ не массив (${typeof raw})`);
    return { ok: false, reason: "bad_shape" };
  }
  const flats = parseFlats(raw);
  // Полный провал разбора: фид приехал, строки в нём есть, но ни одна не прошла
  // валидацию — значит разъехался контракт (например, все числа стали строками),
  // а не «всё продано». Снимок в коде лежит ровно для этого: отдаём его как
  // последний рубеж и орём в лог, чтобы мониторинг увидел (DATA-004).
  if (raw.length > 0 && flats.length === 0) {
    console.error(
      `[api] ${url}: ни одна из ${raw.length} квартир не прошла валидацию — отдаём снимок каталога (src/lib/flats.mock.ts), данные могут быть устаревшими`,
    );
    return { ok: true, flats: MOCK_FLATS, source: "snapshot" };
  }
  return { ok: true, flats, source: "api" };
}

export async function fetchApartmentById(
  id: string,
): Promise<{ flat: Flat; relatedFlats: Flat[] }> {
  if (USE_MOCK_FLATS) {
    const flat = MOCK_FLATS.find((f) => f.number === id);
    // Бросаем, а не возвращаем пустое: вызывающая страница ловит и отдаёт 404 —
    // ровно как при 404 от CRM.
    if (!flat) throw new Error("Failed to fetch apartment data");
    return { flat, relatedFlats: MOCK_FLATS.filter((f) => f.number !== id) };
  }
  const url = `${API_BASE_URL}/flat?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_TIME },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    // 404 от CRM — штатный «нет такой квартиры» (боты ходят по старым ссылкам),
    // остальные статусы — сбой источника, который иначе неотличим от битого id.
    const log = res.status === 404 ? console.warn : console.error;
    log(`[api] квартира ${id} не отдана: ${url} — HTTP ${res.status}`);
    throw new Error("Failed to fetch apartment data");
  }
  const d = (await res.json()) as { flat?: unknown; relatedFlats?: unknown };
  const flat = toFlat(d.flat);
  // Форма пришла битой — ведём себя как при 404 (вызывающая страница ловит → notFound()).
  if (!flat) {
    console.error(`[api] квартира ${id} не отдана: ${url} — flat не прошёл валидацию формы`);
    throw new Error("Failed to fetch apartment data");
  }
  return { flat, relatedFlats: parseFlats(d.relatedFlats ?? []) };
}

// ----- В продаже ли квартира (DATA-007, SEC-024) -----
// Каталог /flats отдаёт только свободные квартиры, а /flat?id= — любую по номеру,
// с любым статусом. Страница квартиры строилась по второму и со списком не
// сверялась: проданные и резервные лоты открывались по прямой ссылке с ценой и
// кнопкой брони.
// Правило: квартира в продаже, если она есть в публичном каталоге — тем же
// списком пользуется сам сайт, и правило не зависит от названий статусов в CRM.
// Если каталог недоступен или подменён снимком из кода — решаем по статусу
// карточки, пропуская только свободные: неизвестный статус = не в продаже.
const ON_SALE_STATUSES = new Set(["free"]);

export async function isFlatOnSale(flat: Flat): Promise<boolean> {
  const list = await fetchApartments();
  if (list.ok && list.source === "api") {
    return list.flats.some((f) => f.number === flat.number);
  }
  return ON_SALE_STATUSES.has(flat.status.trim().toLowerCase());
}

export async function fetchFloorData(id: string) {
  if (USE_MOCK_FLATS) return null; // плана этажа в снимке нет — UI берёт свой
  const url = `${API_BASE_URL}/floor?id=${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_TIME },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    // Деградация мягкая (UI подставит свой мини-план), но не молчаливая:
    // раньше недоступный /floor не оставлял в логах ни строчки.
    if (!res.ok) {
      console.error(`[api] план этажа ${id} недоступен: ${url} — HTTP ${res.status}`);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error(`[api] план этажа ${id} недоступен: ${url} — ${describeError(e)}`);
    return null;
  }
}

// ----- Маппинг API → доменные модели UI -----

// Строка каталога: цену за м² держим в тыс. руб., стоимость — в млн руб.
// (карточка/таблица домножают обратно при выводе).
export function flatToApartment(f: Flat): Apartment {
  return {
    id: f.number,
    floor: f.floor,
    bedrooms: f.numberOfBedrooms,
    area: f.area,
    pricePerM2: Math.round(f.price / 1000),
    cost: f.amount / 1_000_000,
  };
}

export function flatToGenplanApartment(f: Flat): GenplanApartment {
  return {
    ...flatToApartment(f),
    section: f.sectionNumber,
    status: f.status,
    polygon: f.polygon,
    tags: f.tags,
    images: f.images,
    layoutUrl: f.layoutUrl,
    price: f.price,
    amount: f.amount,
    amountDiscount: f.amountDiscount,
  };
}

const COMPLETION = "IV кв. 2027"; // ввода в эксплуатацию нет в API
const VIEW_FALLBACK = "внутренний двор";

// API отдаёт мини-план этажа как inline-SVG с битым MIME (data:xml/svg;base64,…),
// который браузер не рисует как картинку. Правим префикс на корректный image/svg+xml.
function fixSvgDataUri(src: string): string {
  return src.replace(/^data:xml\/svg(;base64)?,/, "data:image/svg+xml$1,");
}

export function flatToDetail(f: Flat): ApartmentDetail {
  const hasDiscount = f.amountDiscount > 0 && f.amountDiscount < f.amount;
  return {
    ...flatToApartment(f),
    number: Number(f.number),
    totalFloors: 0,
    finish: "White Box",
    completion: COMPLETION,
    ceiling: `${f.ceilingHeightM} м`,
    view: f.viewFromWindowTypology ?? VIEW_FALLBACK,
    planType: "",
    totalPrice: hasDiscount ? f.amountDiscount : f.amount,
    oldPrice: hasDiscount ? f.amount : 0,
    tags: [],
    // SEC-005: валидируем схему URL из CRM перед выводом в src/href.
    plan: safeUrl(f.layoutUrl),
    keyPlan: f.floorPlan
      ? safeUrl(fixSvgDataUri(f.floorPlan))
      : "/images/apartment/keyplan-floor.png",
    pdf: safeUrl(f.pdf),
  };
}

// ----- Контент страницы /contact (редактируется в MODX: /api/contact) -----

export type ContactContent = {
  phone: string;
  address: string;
  email: string;
  office: { image: string; alt: string };
  meta: { title: string; description: string };
};

// Fallback-first: если CMS/API недоступны — страница рендерится на этих значениях.
export const CONTACT_FALLBACK: ContactContent = {
  phone: "+7 (495) 123-45-67",
  address: "ул. Климашкина, 7/11",
  email: "private@mr-group.ru",
  office: {
    image: "/images/contact-office.webp",
    alt: "Офис продаж клубного дома k 7/11",
  },
  meta: {
    title: "Контакты",
    description:
      "Офис продаж клубного дома k 7/11: +7 (495) 123-45-67, ул. Климашкина, 7/11, private@mr-group.ru.",
  },
};

// ----- Обобщённый контент страницы (MODX: /api/<alias>, снип pageContent) -----
// Форма ответа: { texts, images, lists, meta } — рефлексия TV шаблона ресурса.

export type PageContent = {
  texts: Record<string, string>;
  images: Record<string, string>;
  lists: Record<string, Array<Record<string, unknown>>>;
  meta: { title: string; description: string };
};

const EMPTY_PAGE: PageContent = {
  texts: {},
  images: {},
  lists: {},
  meta: { title: "", description: "" },
};

// CMS/MODX иногда отдаёт локальный путь с задвоенным ведущим слэшем
// («//images/hero.webp») — next/image трактует «//» как protocol-relative URL и
// падает с «must be changed to an absolute URL». Схлопываем ведущие слэши в один;
// абсолютные (http/https/data) и явно protocol-relative внешние URL не трогаем.
function normalizeImagePath(v: string): string {
  const s = v.trim();
  if (!s || /^(https?:|data:)/i.test(s)) return s;
  return s.replace(/^\/{2,}/, "/");
}

function normalizeImages(images: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(images)) out[k] = normalizeImagePath(String(v ?? ""));
  return out;
}

// dev → без кэша (мгновенно видно правки в локальной админке);
// prod → ISR 60с + тег для точечной ревалидации вебхуком (OnDocFormSave).
function cacheOpts(
  tag: string,
): RequestInit & { next?: { revalidate?: number; tags?: string[] } } {
  return process.env.NODE_ENV === "development"
    ? { cache: "no-store" }
    : { next: { revalidate: REVALIDATE_TIME, tags: [tag] } };
}

export async function fetchPage(alias: string): Promise<PageContent> {
  try {
    const res = await fetch(`${API_BASE_URL}/${alias}`, {
      ...cacheOpts(`page:${alias}`),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return EMPTY_PAGE;
    const d = (await res.json()) as Partial<PageContent>;
    return {
      texts: d.texts ?? {},
      images: normalizeImages(d.images ?? {}),
      lists: d.lists ?? {},
      meta: {
        title: d.meta?.title ?? "",
        description: d.meta?.description ?? "",
      },
    };
  } catch {
    return EMPTY_PAGE;
  }
}

// Хелперы чтения с фолбэком (пустое/отсутствующее значение → дефолт из кода).
export function txt(c: PageContent, key: string, fallback: string): string {
  const v = c.texts[key];
  return v && v.trim() ? v : fallback;
}
export function img(c: PageContent, key: string, fallback: string): string {
  const v = c.images[key];
  return v && v.trim() ? v : fallback;
}

export type CmsSlide = { src: string; caption?: string; alt?: string };
export type CmsGalleryItem = {
  src: string;
  caption?: string;
  variant?: "wide" | "narrow";
};

// MIGX-элементы хранят поле `image`; UI ждёт `src`.
export function cmsSlides(c: PageContent, key: string, fallback: CmsSlide[]): CmsSlide[] {
  const list = c.lists[key];
  if (!Array.isArray(list) || !list.length) return fallback;
  return list.map((x) => ({
    src: normalizeImagePath(String(x.image ?? "")),
    caption: x.caption ? String(x.caption) : undefined,
    alt: x.alt ? String(x.alt) : undefined,
  }));
}
export function cmsGallery(
  c: PageContent,
  key: string,
  fallback: CmsGalleryItem[],
): CmsGalleryItem[] {
  const list = c.lists[key];
  if (!Array.isArray(list) || !list.length) return fallback;
  return list.map((x) => ({
    src: normalizeImagePath(String(x.image ?? "")),
    caption: x.caption ? String(x.caption) : undefined,
    variant: x.variant === "narrow" ? "narrow" : "wide",
  }));
}

export async function fetchContact(): Promise<ContactContent> {
  try {
    const res = await fetch(`${API_BASE_URL}/contact`, {
      ...cacheOpts("contact"),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return CONTACT_FALLBACK;
    const d = (await res.json()) as Partial<ContactContent>;
    const f = CONTACT_FALLBACK;
    return {
      phone: d.phone || f.phone,
      address: d.address || f.address,
      email: d.email || f.email,
      office: {
        image: normalizeImagePath(d.office?.image || f.office.image),
        alt: d.office?.alt || f.office.alt,
      },
      meta: {
        title: d.meta?.title || f.meta.title,
        description: d.meta?.description || f.meta.description,
      },
    };
  } catch {
    return CONTACT_FALLBACK;
  }
}
