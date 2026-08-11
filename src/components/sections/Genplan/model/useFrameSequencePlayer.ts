"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GENPLAN_FPS,
  GENPLAN_FRAME_HEIGHT,
  GENPLAN_FRAME_PATHS,
  GENPLAN_FRAME_WIDTH,
  GENPLAN_VIEWS,
} from "./config";
import type { GenplanPlayerState } from "./types";

const LOAD_CONCURRENCY = 4;

const INITIAL_STATE: GenplanPlayerState = {
  currentViewIndex: 0,
  status: "loading",
  progress: 0,
  error: null,
};

function getFrameRange(from: number, to: number) {
  const direction = to >= from ? 1 : -1;
  const frames: number[] = [];

  for (let frame = from; direction > 0 ? frame <= to : frame >= to; frame += direction) {
    frames.push(frame);
  }

  return frames;
}

export function useFrameSequencePlayer(enabled: boolean) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCacheRef = useRef(new Map<number, HTMLImageElement>());
  const frameRequestsRef = useRef(new Map<number, Promise<HTMLImageElement>>());
  const rafRef = useRef<number | null>(null);
  const taskIdRef = useRef(0);
  const [state, setState] = useState<GenplanPlayerState>(INITIAL_STATE);

  const drawFrame = useCallback((image: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });

    if (!canvas || !context) return;

    context.clearRect(0, 0, GENPLAN_FRAME_WIDTH, GENPLAN_FRAME_HEIGHT);
    context.drawImage(image, 0, 0, GENPLAN_FRAME_WIDTH, GENPLAN_FRAME_HEIGHT);
  }, []);

  const loadFrame = useCallback((frameIndex: number) => {
    const cached = frameCacheRef.current.get(frameIndex);
    if (cached) return Promise.resolve(cached);

    const activeRequest = frameRequestsRef.current.get(frameIndex);
    if (activeRequest) return activeRequest;

    const source = GENPLAN_FRAME_PATHS[frameIndex];
    if (!source) return Promise.reject(new Error(`Не найден кадр ${frameIndex}`));

    const request = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Не удалось загрузить ${source}`));
      image.src = source;
    })
      .then(async (image) => {
        try {
          await image.decode();
        } catch {
          // onload уже подтвердил, что браузер может использовать изображение.
        }

        frameCacheRef.current.set(frameIndex, image);
        frameRequestsRef.current.delete(frameIndex);

        return image;
      })
      .catch((error: unknown) => {
        frameRequestsRef.current.delete(frameIndex);
        throw error;
      });

    frameRequestsRef.current.set(frameIndex, request);

    return request;
  }, []);

  const loadFrames = useCallback(
    async (frameIndices: number[], onProgress?: (progress: number) => void) => {
      let cursor = 0;
      let loaded = 0;

      const worker = async () => {
        while (cursor < frameIndices.length) {
          const frameIndex = frameIndices[cursor];
          cursor += 1;
          await loadFrame(frameIndex);
          loaded += 1;
          onProgress?.(loaded / frameIndices.length);
        }
      };

      const workers = Array.from(
        { length: Math.min(LOAD_CONCURRENCY, frameIndices.length) },
        () => worker(),
      );

      await Promise.all(workers);
    },
    [loadFrame],
  );

  const animateFrames = useCallback(
    (frameIndices: number[], taskId: number) =>
      new Promise<void>((resolve) => {
        const frameDuration = 1000 / GENPLAN_FPS;
        const startedAt = performance.now();
        let lastDrawnPosition = -1;

        const tick = (now: number) => {
          if (taskIdRef.current !== taskId) {
            resolve();
            return;
          }

          const position = Math.min(
            frameIndices.length - 1,
            Math.floor((now - startedAt) / frameDuration),
          );

          if (position !== lastDrawnPosition) {
            const image = frameCacheRef.current.get(frameIndices[position]);
            if (image) drawFrame(image);
            lastDrawnPosition = position;
          }

          if (position >= frameIndices.length - 1) {
            resolve();
            return;
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      }),
    [drawFrame],
  );

  const goToView = useCallback(
    async (targetViewIndex: number) => {
      if (!enabled || targetViewIndex === state.currentViewIndex) return;
      if (state.status !== "ready") return;

      const currentView = GENPLAN_VIEWS[state.currentViewIndex];
      const targetView = GENPLAN_VIEWS[targetViewIndex];
      if (!currentView || !targetView) return;

      const taskId = taskIdRef.current + 1;
      taskIdRef.current = taskId;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const frameIndices = reducedMotion
        ? [targetView.frameIndex]
        : getFrameRange(currentView.frameIndex, targetView.frameIndex);

      setState((previous) => ({
        ...previous,
        status: "playing",
        error: null,
      }));

      try {
        if (reducedMotion) {
          const image = frameCacheRef.current.get(targetView.frameIndex);
          if (image) drawFrame(image);
        } else {
          await animateFrames(frameIndices, taskId);
        }

        if (taskIdRef.current !== taskId) return;

        const finalFrame = frameCacheRef.current.get(targetView.frameIndex);
        if (finalFrame) drawFrame(finalFrame);

        setState({
          currentViewIndex: targetViewIndex,
          status: "ready",
          progress: 1,
          error: null,
        });
      } catch (error) {
        if (taskIdRef.current !== taskId) return;

        setState((previous) => ({
          ...previous,
          status: "error",
          error: error instanceof Error ? error.message : "Не удалось загрузить раскадровку",
        }));
      }
    },
    [animateFrames, drawFrame, enabled, state],
  );

  useEffect(() => {
    if (!enabled) return;

    const taskId = taskIdRef.current + 1;
    taskIdRef.current = taskId;
    const firstFrameIndex = GENPLAN_VIEWS[0].frameIndex;
    const allFrameIndices = GENPLAN_FRAME_PATHS.map((_, frameIndex) => frameIndex);

    setState(INITIAL_STATE);

    void loadFrames(allFrameIndices, (progress) => {
      if (taskIdRef.current !== taskId) return;
      setState((previous) => ({ ...previous, progress }));
    })
      .then(() => {
        if (taskIdRef.current !== taskId) return;

        const image = frameCacheRef.current.get(firstFrameIndex);
        if (!image) throw new Error("Не удалось подготовить первый кадр");

        drawFrame(image);
        setState({ currentViewIndex: 0, status: "ready", progress: 1, error: null });
      })
      .catch((error: unknown) => {
        if (taskIdRef.current !== taskId) return;
        setState({
          currentViewIndex: 0,
          status: "error",
          progress: 0,
          error: error instanceof Error ? error.message : "Не удалось загрузить первый кадр",
        });
      });
  }, [drawFrame, enabled, loadFrames]);

  useEffect(
    () => () => {
      taskIdRef.current += 1;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      for (const image of frameCacheRef.current.values()) image.src = "";
      frameCacheRef.current.clear();
      frameRequestsRef.current.clear();
    },
    [],
  );

  return {
    canvasRef,
    state,
    goToView,
  };
}
