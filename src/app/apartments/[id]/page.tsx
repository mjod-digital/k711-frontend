import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchApartmentById, fetchApartments, flatToDetail } from "@/lib/api";
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
  if (!data?.flat) return { title: "Квартира не найдена" };
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
  // Некорректный/неполный ответ CRM (нет flat) → 404, а не краш пре-рендера сборки.
  if (!data?.flat) notFound();
  return <ApartmentCard apt={flatToDetail(data.flat)} />;
}
