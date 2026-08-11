import type { GenplanViewId } from "@/lib/apartments";

export const GENPLAN_FRAME_WIDTH = 1920;
export const GENPLAN_FRAME_HEIGHT = 1080;
export const GENPLAN_FPS = 22;

export type GenplanView = {
  id: GenplanViewId;
  label: string;
  frameIndex: number;
};

export const GENPLAN_FRAME_PATHS = Array.from({ length: 57 }, (_, index) => {
  const sourceFrameNumber = index * 2 + 1;

  return `/images/genplan/frame_${String(sourceFrameNumber).padStart(4, "0")}.webp`;
});

export const GENPLAN_VIEWS = [
  { id: "street", label: "Фасад", frameIndex: 0 },
  { id: "corner", label: "Угол", frameIndex: 14 },
  { id: "courtyard", label: "Двор", frameIndex: 56 },
] as const satisfies readonly GenplanView[];
