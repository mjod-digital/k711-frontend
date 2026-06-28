import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { APARTMENTS, getApartmentDetail } from "@/lib/apartments";
import { ApartmentCard } from "@/components/sections/ApartmentCard";

// Статически пререндерим все квартиры каталога (UI-каркас; TODO: API).
export function generateStaticParams() {
  return APARTMENTS.map((a) => ({ id: a.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const apt = getApartmentDetail(id);
  if (!apt) return { title: "Квартира не найдена" };
  return {
    title: `Квартира №${apt.number}`,
    description: `Квартира №${apt.number} в клубном доме k 7/11 — ${apt.bedrooms}-комнатная, ${apt.area} м², ${apt.floor} этаж.`,
  };
}

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apt = getApartmentDetail(id);
  if (!apt) notFound();
  return <ApartmentCard apt={apt} />;
}
