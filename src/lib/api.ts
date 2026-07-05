import type { Apartment, ApartmentDetail } from "./apartments";

// ============================================================
//   API клубного дома Климашкина 7/11.
//   id квартиры для /flat и роутинга — это поле `number` (уникальное).
// ============================================================
// База контент-API (MODX). Локально — http://localhost:8080/api (см. .env.local),
// на проде переменная не задана → продовый адрес.
const API_BASE_URL =
  process.env.API_BASE_URL ?? "https://www.klimashkina711.ru/api";
const REVALIDATE_TIME = 60;

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
  layoutUrl: string; // планировка (внешний S3)
  floorPlan: string; // мини-план этажа (внешний S3)
};

export async function fetchApartments(): Promise<Flat[]> {
  const res = await fetch(`${API_BASE_URL}/flats`, {
    next: { revalidate: REVALIDATE_TIME },
  });
  if (!res.ok) throw new Error("Failed to fetch apartments");
  return res.json();
}

export async function fetchApartmentById(
  id: string,
): Promise<{ flat: Flat; relatedFlats: Flat[] }> {
  const res = await fetch(`${API_BASE_URL}/flat?id=${encodeURIComponent(id)}`, {
    next: { revalidate: REVALIDATE_TIME },
  });
  if (!res.ok) throw new Error("Failed to fetch apartment data");
  return res.json();
}

export async function fetchFloorData(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/floor?id=${encodeURIComponent(id)}`, {
      next: { revalidate: REVALIDATE_TIME },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
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
    plan: f.layoutUrl,
    keyPlan: f.floorPlan ? fixSvgDataUri(f.floorPlan) : "/images/apartment/keyplan-floor.png",
    pdf: f.pdf,
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
    image: "/images/contact-office.jpg",
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
// («//images/hero.jpg») — next/image трактует «//» как protocol-relative URL и
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
    const res = await fetch(`${API_BASE_URL}/${alias}`, cacheOpts(`page:${alias}`));
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
    const res = await fetch(`${API_BASE_URL}/contact`, cacheOpts("contact"));
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
