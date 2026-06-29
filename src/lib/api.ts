import type { Apartment, ApartmentDetail } from "./apartments";

// ============================================================
//   API клубного дома Климашкина 7/11.
//   id квартиры для /flat и роутинга — это поле `number` (уникальное).
// ============================================================
const API_BASE_URL = "https://www.klimashkina711.ru/api";
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
  };
}
