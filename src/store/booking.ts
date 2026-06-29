"use client";

import { create } from "zustand";

// ============================================================
//   Глобальное состояние попапов (бронирование + успех).
//   Транзиентное (не persist): живёт только в рамках сессии вкладки.
//   open из карточек (ApartmentCard / избранное) и из формы Contact.
// ============================================================
type PopupMode = "booking" | "success" | null;

type BookingState = {
  mode: PopupMode;
  apartmentNumber: number | null;
  openBooking: (apartmentNumber: number) => void;
  openSuccess: () => void;
  close: () => void;
};

export const useBooking = create<BookingState>((set) => ({
  mode: null,
  apartmentNumber: null,
  openBooking: (apartmentNumber) => set({ mode: "booking", apartmentNumber }),
  openSuccess: () => set({ mode: "success" }),
  close: () => set({ mode: null }),
}));
