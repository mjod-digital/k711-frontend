"use client";

import type { ReactNode } from "react";
import { useBooking } from "@/store/booking";
import type { LeadApartment } from "@/lib/comagic";

// Клиентский триггер попапа бронирования (для серверных карточек, напр. ApartmentCard).
// Передаёт объект квартиры в глобальный стор → открывает попап «Забронировать
// резиденцию №N», а данные (№, площадь, этаж, комнаты, цена) уходят в заявку.
export function BookButton({
  apartment,
  className,
  children,
}: {
  apartment: LeadApartment;
  className?: string;
  children: ReactNode;
}) {
  const openBooking = useBooking((s) => s.openBooking);
  return (
    <button
      type="button"
      className={className}
      onClick={() => openBooking(apartment)}
    >
      {children}
    </button>
  );
}
