import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect, который не шумит предупреждением на сервере.
 * На клиенте — useLayoutEffect (срабатывает до отрисовки, без вспышки),
 * на сервере (где layout-эффекты не выполняются) — useEffect-заглушка.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
