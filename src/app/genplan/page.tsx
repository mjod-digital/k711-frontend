import type { Metadata } from "next";
import { fetchApartments, flatToGenplanApartment } from "@/lib/api";
import { notFound } from "next/navigation";
import { Genplan } from "@/components/sections/Genplan";
import { MobileRedirect } from "./MobileRedirect";

export const metadata: Metadata = {
  title: "Выбор резиденции",
  description: "Интерактивный выбор резиденции по сторонам клубного дома k 7/11.",
};

export default async function GenplanPage() {
  const apartments = await fetchApartments()
    .then((flats) => flats.map(flatToGenplanApartment))
    .catch(() => []);

  if (apartments.length <= 0) return notFound();

  return (
    <>
      <MobileRedirect />
      <Genplan
        apartments={apartments}
        itemsBreadcrumb={[
          { label: '…', href: '/', ariaLabel: 'Главная' },
          { label: 'Генплан' },
        ]}
      />
    </>
  );
}
