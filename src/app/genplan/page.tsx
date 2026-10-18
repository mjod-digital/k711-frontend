import type { Metadata } from "next";
import { fetchApartments, flatToGenplanApartment } from "@/lib/api";
import { notFound } from "next/navigation";
import { Genplan } from "@/components/sections/Genplan";
import { CatalogUnavailable } from "@/components/sections/CatalogUnavailable";
import { ROUTES_PATH } from "@/config/site";
import { MobileRedirect } from "./MobileRedirect";

export const metadata: Metadata = {
  title: "Выбор резиденции",
  description: "Интерактивный выбор резиденции по сторонам клубного дома k 7/11.",
};

export default async function GenplanPage() {
  const result = await fetchApartments();

  // Сбой источника — это не «страницы нет»: прежний 404 отправлял покупателя
  // в тупик и выглядел так, будто дом снят с продажи (DATA-005). Показываем
  // состояние сбоя с телефоном и уводим в каталог — данные там те же.
  if (!result.ok) {
    return (
      <CatalogUnavailable
        title="визуальный выбор временно недоступен"
        headingAs="h1"
        action={{ label: "перейти в каталог", href: ROUTES_PATH.apartments }}
      />
    );
  }

  const apartments = result.flats.map(flatToGenplanApartment);

  // Источник ответил, но предложений нет — генплан рисовать не на чем.
  // Это по-прежнему «контента нет», а не «сломалось», поэтому 404 оставляем.
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
