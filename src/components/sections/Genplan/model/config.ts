import type { GenplanViewId } from "@/lib/apartments";

export const GENPLAN_FRAME_WIDTH = 1298;
export const GENPLAN_FRAME_HEIGHT = 730;
export const GENPLAN_FPS = 22;

export type GenplanView = {
  id: GenplanViewId;
  label: string;
  frameIndex: number;
};

export const GENPLAN_FRAME_PATHS = Array.from(
  { length: 62 },
  (_, index) => `/images/genplan/${String(index + 1).padStart(2, "0")}.jpg`,
);

export const GENPLAN_VIEWS = [
  { id: "street", label: "Фасад", frameIndex: 0 },
  { id: "corner", label: "Угол", frameIndex: 19 },
  { id: "courtyard", label: "Двор", frameIndex: 61 },
] as const satisfies readonly GenplanView[];
