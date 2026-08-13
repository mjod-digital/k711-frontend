export type GenplanPlayerStatus = "loading" | "ready" | "playing" | "error";

export type GenplanPlayerState = {
  currentViewIndex: number;
  status: GenplanPlayerStatus;
  progress: number;
  error: string | null;
};
