import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchApartmentById, fetchApartments, flatToDetail } from "@/lib/api";
import { ApartmentCard } from "@/components/sections/ApartmentCard";

// Пререндерим все квартиры каталога (id = number из CRM).
export async function generateStaticParams() {
  try {
    const flats = await fetchApartments();
    return flats.map((f) => ({ id: f.number }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchApartmentById(id).catch(() => null);
  if (!data) return { title: "Квартира не найдена" };
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
  if (!data) notFound();
  console.log(`[apartment ${id}] API response:`, JSON.stringify(data, null, 2));
  return <ApartmentCard apt={flatToDetail(data.flat)} />;
}
