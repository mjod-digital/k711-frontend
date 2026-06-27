// Каталог квартир. TODO: заменить статические данные на загрузку из API —
// сейчас это UI-каркас (вёрстка списка/фильтров и страницы квартиры).

export type Apartment = {
  id: string;
  floor: number; // этаж
  bedrooms: number; // спальни (1–4)
  area: number; // площадь, м²
  pricePerM2: number; // цена за 1 м², тыс. руб.
  cost: number; // стоимость, млн руб.
};

// Диапазоны фильтров (из макета 373-9580).
export const FILTER_RANGES = {
  floor: [2, 13] as [number, number],
  area: [86, 1457] as [number, number],
  pricePerM2: [1362, 4768] as [number, number],
  cost: [128, 220] as [number, number],
};

export const BEDROOM_OPTIONS = [1, 2, 3, 4];

export const APARTMENTS: Apartment[] = [
  { id: "a-204", floor: 2, bedrooms: 1, area: 86, pricePerM2: 1362, cost: 128 },
  { id: "a-311", floor: 3, bedrooms: 1, area: 94, pricePerM2: 1480, cost: 139 },
  { id: "a-405", floor: 4, bedrooms: 2, area: 112, pricePerM2: 1620, cost: 151 },
  { id: "a-512", floor: 5, bedrooms: 2, area: 124, pricePerM2: 1780, cost: 158 },
  { id: "a-603", floor: 6, bedrooms: 2, area: 138, pricePerM2: 1960, cost: 164 },
  { id: "a-708", floor: 7, bedrooms: 3, area: 156, pricePerM2: 2150, cost: 172 },
  { id: "a-801", floor: 8, bedrooms: 3, area: 178, pricePerM2: 2380, cost: 181 },
  { id: "a-905", floor: 9, bedrooms: 3, area: 203, pricePerM2: 2640, cost: 189 },
  { id: "a-1002", floor: 10, bedrooms: 2, area: 132, pricePerM2: 2920, cost: 176 },
  { id: "a-1107", floor: 11, bedrooms: 4, area: 256, pricePerM2: 3240, cost: 198 },
  { id: "a-1203", floor: 12, bedrooms: 4, area: 312, pricePerM2: 3680, cost: 207 },
  { id: "a-1301", floor: 13, bedrooms: 4, area: 1457, pricePerM2: 4768, cost: 220 },
  { id: "a-409", floor: 4, bedrooms: 1, area: 98, pricePerM2: 1540, cost: 133 },
  { id: "a-706", floor: 7, bedrooms: 2, area: 145, pricePerM2: 2080, cost: 168 },
  { id: "a-910", floor: 9, bedrooms: 4, area: 289, pricePerM2: 3460, cost: 212 },
  { id: "a-1108", floor: 11, bedrooms: 3, area: 224, pricePerM2: 2780, cost: 194 },
];

export const getApartment = (id: string) =>
  APARTMENTS.find((a) => a.id === id);

// ============================================================
//   Карточка квартиры (страница /apartments/[id], макет 481-12150 / 433-15174).
//   Детальные поля — пока сэмпл/производные (UI-каркас). TODO: реальный API.
// ============================================================
export type ApartmentDetail = Apartment & {
  number: number; // № квартиры
  totalFloors: number; // этажей в доме (для «8 из 11»)
  finish: string; // отделка
  completion: string; // ввод в эксплуатацию
  ceiling: string; // высота потолков
  view: string; // вид из окна
  planType: string; // тип планировки
  totalPrice: number; // полная стоимость, ₽
  oldPrice: number; // старая (зачёркнутая) цена, ₽
  tags: string[]; // фичи-теги (Пентхаус, Терраса…)
  plan: string; // изображение планировки квартиры
  keyPlan: string; // мини-план этажа (расположение квартиры)
};

const TOTAL_FLOORS = 13;
const VIEWS = ["3-я Рыбинская", "Пресненский Вал", "внутренний двор", "Большая Грузинская"];

export function getApartmentDetail(id: string): ApartmentDetail | undefined {
  const a = getApartment(id);
  if (!a) return undefined;
  const totalPrice = a.cost * 1_000_000;
  const tags = [
    a.floor >= 11 && "Пентхаус",
    a.bedrooms >= 3 && "Терраса",
    "Антресольный этаж",
  ].filter(Boolean) as string[];
  return {
    ...a,
    number: Number(id.replace(/\D/g, "")) || a.floor,
    totalFloors: TOTAL_FLOORS,
    finish: "White Box",
    completion: "III кв. 2028",
    ceiling: "2.9 м",
    view: VIEWS[a.floor % VIEWS.length],
    planType: "Линейная (вид на 1 сторону)",
    totalPrice,
    oldPrice: Math.round((totalPrice * 1.23) / 1000) * 1000,
    tags,
    plan: "/images/apartment/plan-sample.png",
    keyPlan: "/images/apartment/keyplan-sample.png",
  };
}

// Форматирование чисел в ru-локали (неразрывные пробелы как разделители тысяч).
export const ru = (n: number) => n.toLocaleString("ru-RU");
