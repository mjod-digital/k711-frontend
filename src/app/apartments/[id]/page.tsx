import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchApartmentById, fetchApartments, flatToDetail, isFlatOnSale } from "@/lib/api";
import { ApartmentCard } from "@/components/sections/ApartmentCard";

// Пререндерим все квартиры каталога (id = number из CRM).
// Источник недоступен на сборке — пререндерить нечего, страницы отрендерятся
// по запросу; причину уже написал в лог сам fetchApartments (DATA-005).
export async function generateStaticParams() {
  const result = await fetchApartments();
  if (!result.ok) return [];
  return result.flats.map((f) => ({ id: f.number }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchApartmentById(id).catch(() => null);
  // Для квартиры не в продаже — тот же заголовок, что у 404: ни площадь, ни
  // этаж в метаданные не попадают (страница всё равно уйдёт в notFound()).
  if (!data?.flat || !(await isFlatOnSale(data.flat))) return { title: "Квартира не найдена" };
  const { flat } = data;
  return {
    title: `Квартира №${flat.number}`,
    description: `Квартира №${flat.number} в клубном доме k 7/11 — ${flat.numberOfBedrooms}-комнатная, ${flat.area} м², ${flat.floor} этаж.`,
  };
}

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchApartmentById(id).catch(() => null);
  // 404 со своей страницей «квартира не найдена» (not-found.tsx рядом), если:
  // номера нет, ответ CRM битый, или квартира не в продаже — продана, в резерве,
  // снята. Раньше такие лоты открывались по прямой ссылке с ценой и бронью.
  if (!data?.flat || !(await isFlatOnSale(data.flat))) notFound();
  return <ApartmentCard apt={flatToDetail(data.flat)} />;
}
