"use client";

import type { ReactNode } from "react";
import { useBooking } from "@/store/booking";

// Клиентский триггер попапа бронирования (для серверных карточек, напр. ApartmentCard).
// Передаёт номер квартиры в глобальный стор → открывает попап «Забронировать резиденцию №N».
export function BookButton({
  number,
  className,
  children,
}: {
  number: number;
  className?: string;
  children: ReactNode;
}) {
  const openBooking = useBooking((s) => s.openBooking);
  return (
    <button
      type="button"
      className={className}
      onClick={() => openBooking(number)}
    >
      {children}
    </button>
  );
}
