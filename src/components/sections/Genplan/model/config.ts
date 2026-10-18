import type { GenplanViewId } from "@/lib/apartments";

export const GENPLAN_FRAME_WIDTH = 5000;
export const GENPLAN_FRAME_HEIGHT = 2812;
export const GENPLAN_FPS = 60;

export type GenplanView = {
  id: GenplanViewId;
  label: string;
  frameIndex: number;
};

export const GENPLAN_FRAME_PATHS = Array.from(
  { length: 238 },
  (_, index) => `/images/genplan/${String(index).padStart(4, "0")}.webp`,
);

export const GENPLAN_VIEWS = [
  { id: "street", label: "Фасад", frameIndex: 1 },
  { id: "corner", label: "Угол", frameIndex: 67 },
  { id: "courtyard", label: "Двор", frameIndex: 237 },
] as const satisfies readonly GenplanView[];

// Опорные кадры — единственные состояния покоя сцены (ракурсы «улица», «угол»,
// «двор»). Остальные 235 кадров существуют только ради анимации перехода, поэтому
// именно по этим трём считается готовность страницы и прогресс загрузки (PERF-001).
export const GENPLAN_ANCHOR_FRAME_INDICES: readonly number[] = GENPLAN_VIEWS.map(
  (view) => view.frameIndex,
);
