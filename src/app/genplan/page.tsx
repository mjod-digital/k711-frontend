import type { Metadata } from "next";
import { fetchApartments, flatToGenplanApartment } from "@/lib/api";
import { MOCK_FLATS } from "@/lib/flats.mock";
import { notFound } from "next/navigation";
import { Genplan } from "@/components/sections/Genplan";

export const metadata: Metadata = {
  title: "Выбор резиденции",
  description: "Интерактивный выбор резиденции по сторонам клубного дома k 7/11.",
};

const isMock = true;

export default async function GenplanPage() {
  const flats = isMock ? MOCK_FLATS : await fetchApartments().catch(() => []);
  const apartments = flats.map(flatToGenplanApartment);

  if (apartments.length <= 0) return notFound();

  return (
    <Genplan
      apartments={apartments}
      itemsBreadcrumb={[
        { label: '…', href: '/', ariaLabel: 'Главная' },
        { label: 'Генплан' },
      ]}
    />
  );
}
