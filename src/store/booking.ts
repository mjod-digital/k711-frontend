"use client";

import { create } from "zustand";
import type { LeadApartment } from "@/lib/comagic";

// ============================================================
//   Глобальное состояние попапов (бронирование + успех).
//   Транзиентное (не persist): живёт только в рамках сессии вкладки.
//   open из карточек (ApartmentCard / избранное) и из формы Contact.
//   При бронировании несём объект квартиры целиком — он уходит в заявку
//   (номер, площадь, этаж, комнаты, цена) через sendLead → CoMagic.
// ============================================================
type PopupMode = "booking" | "success" | null;

type BookingState = {
  mode: PopupMode;
  apartment: LeadApartment | null;
  openBooking: (apartment: LeadApartment) => void;
  openSuccess: () => void;
  close: () => void;
};

export const useBooking = create<BookingState>((set) => ({
  mode: null,
  apartment: null,
  openBooking: (apartment) => set({ mode: "booking", apartment }),
  openSuccess: () => set({ mode: "success" }),
  close: () => set({ mode: null }),
}));
