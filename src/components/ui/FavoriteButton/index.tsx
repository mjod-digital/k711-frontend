"use client";

import { useFavorites, useHydrated } from "@/store/favorites";
import { cn } from "@/lib/utils";

// Кнопка «в избранное» для конкретной квартиры. Тянет состояние из глобального
// стора (zustand), сама подсвечивается. Класс кнопки задаёт вызывающий компонент.
export function FavoriteButton({
  id,
  className,
  activeClassName,
}: {
  id: string;
  className?: string;
  activeClassName?: string;
}) {
  const favIds = useFavorites((s) => s.ids);
  const toggle = useFavorites((s) => s.toggle);
  const hydrated = useHydrated();
  const fav = hydrated && favIds.includes(id);

  return (
    <button
      type="button"
      className={cn(className, fav && activeClassName)}
      aria-pressed={fav}
      aria-label={fav ? "Убрать из избранного" : "В избранное"}
      onClick={() => toggle(id)}
    >
      <svg viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} aria-hidden="true">
        <path
          d="M12 20.3l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.54L12 20.3z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
      </svg>
    </button>
  );
}
