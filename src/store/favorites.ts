"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================
//   Избранные квартиры. Нужна общая, переживающая перезагрузку,
//   доступная из шапки / каталога / карточки / страницы избранного —
//   единственный реально глобальный стейт, поэтому zustand + persist.
//   Фильтры каталога локальны (живут в самом каталоге) и в стор не выносим.
// ============================================================
type FavoritesState = {
  ids: string[];
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useFavorites = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id)
            ? s.ids.filter((x) => x !== id)
            : [...s.ids, id],
        })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
    }),
    { name: "k711-favorites" },
  ),
);

// Хелпер: смонтирован ли клиент (избегаем рассинхрона SSR/гидратации —
// до маунта избранное считаем пустым, как на сервере).
import { useEffect, useState } from "react";
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
