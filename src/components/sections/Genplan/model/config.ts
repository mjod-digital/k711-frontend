import type { GenplanViewId } from "@/lib/apartments";

export const GENPLAN_FRAME_WIDTH = 5000;
export const GENPLAN_FRAME_HEIGHT = 2812;
export const GENPLAN_FPS = 35;

export type GenplanView = {
  id: GenplanViewId;
  label: string;
  frameIndex: number;
};

export const GENPLAN_FRAME_PATHS = Array.from(
  { length: 238 },
  (_, index) => `/images/genplan/${String(index).padStart(4, "0")}.jpg`,
);

export const GENPLAN_VIEWS = [
  { id: "street", label: "Фасад", frameIndex: 1 },
  { id: "corner", label: "Угол", frameIndex: 67 },
  { id: "courtyard", label: "Двор", frameIndex: 237 },
] as const satisfies readonly GenplanView[];
