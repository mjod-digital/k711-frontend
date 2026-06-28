// Доменные типы каталога квартир. Данные приходят из API (src/lib/api.ts);
// здесь — формы и утилиты подсчёта диапазонов/опций фильтров.

export type Apartment = {
  id: string; // = number из API (уникальный)
  floor: number;
  bedrooms: number;
  area: number; // м²
  pricePerM2: number; // тыс руб/м²
  cost: number; // млн руб
};

export type ApartmentDetail = Apartment & {
  number: number; // № квартиры
  totalFloors: number;
  finish: string;
  completion: string; // ввод в эксплуатацию
  ceiling: string; // высота потолков
  view: string; // вид из окна
  planType: string;
  totalPrice: number; // полная стоимость, ₽
  oldPrice: number; // старая (зачёркнутая) цена, ₽ — 0, если скидки нет
  tags: string[];
  plan: string; // изображение планировки квартиры
  keyPlan: string; // мини-план этажа
};

export type Range = [number, number];

// Диапазоны фильтров из набора квартир (мин/макс, округлённые под слайдер).
export function catalogRanges(items: Apartment[]) {
  const span = (sel: (a: Apartment) => number): Range => {
    if (!items.length) return [0, 0];
    const xs = items.map(sel);
    return [Math.floor(Math.min(...xs)), Math.ceil(Math.max(...xs))];
  };
  return {
    floor: span((a) => a.floor),
    area: span((a) => a.area),
    pricePerM2: span((a) => a.pricePerM2),
    cost: span((a) => a.cost),
  };
}

export function bedroomOptions(items: Apartment[]): number[] {
  return [...new Set(items.map((a) => a.bedrooms))].sort((a, b) => a - b);
}

// Форматирование чисел в ru-локали (неразрывные пробелы как разделители тысяч).
export const ru = (n: number) => n.toLocaleString("ru-RU");
