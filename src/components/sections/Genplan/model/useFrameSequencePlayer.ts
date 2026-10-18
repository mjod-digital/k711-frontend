"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GENPLAN_ANCHOR_FRAME_INDICES,
  GENPLAN_FPS,
  GENPLAN_FRAME_HEIGHT,
  GENPLAN_FRAME_WIDTH,
  GENPLAN_VIEWS,
} from "./config";
import {
  createFrameStore,
  decodeFrame,
  isArcPlayable,
  loadAnchorFrame,
  prefetchFrames,
  releaseFrameStore,
  touchDecodedFrame,
  type FrameStore,
} from "./frameStore";
import type { GenplanPlayerState } from "./types";

// ───────────────────────────────────────────────────────────────────────────
// Двухфазная загрузка раскадровки (PERF-001).
//
// Состояний покоя у сцены всего три — опорные кадры ракурсов «улица», «угол»,
// «двор». Остальные 235 кадров нужны исключительно для анимации перехода,
// поэтому сцена включается после трёх кадров (~3 МБ), а не после всех 46,5 МБ,
// а индикатор считает прогресс только по опорным кадрам.
//
// Переход анимируется, только если его кадры уже скачаны; пока их нет —
// переключаемся на целевой ракурс сразу, без анимации. Память ограничена
// кешем из frameStore.ts (PERF-004).
// ───────────────────────────────────────────────────────────────────────────

/** На сколько кадров вперёд распаковываем во время проигрывания. */
const DECODE_LOOKAHEAD = 10;

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
  const rafRef = useRef<number | null>(null);
  const taskIdRef = useRef(0);
  const storeRef = useRef<FrameStore | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** Кадр текущего ракурса — вокруг него приоритезируется фоновая догрузка. */
  const focusFrameRef = useRef<number>(GENPLAN_VIEWS[0].frameIndex);
  const [state, setState] = useState<GenplanPlayerState>(INITIAL_STATE);
  const [wasEnabled, setWasEnabled] = useState(enabled);

  // Сцена включается и выключается по ширине экрана. При повторном включении
  // загрузка начинается заново, поэтому состояние сбрасываем в рендере
  // (подстройка состояния под изменившийся пропс), а не в эффекте.
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled);
    setState(INITIAL_STATE);
  }

  const drawFrame = useCallback((bitmap: ImageBitmap) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });

    if (!canvas || !context) return;

    context.clearRect(0, 0, GENPLAN_FRAME_WIDTH, GENPLAN_FRAME_HEIGHT);
    context.drawImage(bitmap, 0, 0, GENPLAN_FRAME_WIDTH, GENPLAN_FRAME_HEIGHT);
  }, []);

  const playArc = useCallback(
    (store: FrameStore, signal: AbortSignal, frames: number[], taskId: number) =>
      new Promise<void>((resolve) => {
        const frameDuration = 1000 / GENPLAN_FPS;
        const startedAt = performance.now();
        let lastPosition = -1;

        // Распаковываем с запасом вперёд: кадр должен быть готов к своему тику,
        // но в памяти одновременно живёт только окно, а не весь перегон.
        const decodeAhead = (position: number) => {
          const until = Math.min(frames.length, position + DECODE_LOOKAHEAD);

          for (let next = position; next < until; next += 1) {
            void decodeFrame(store, frames[next], signal);
          }
        };

        const tick = (now: number) => {
          if (taskIdRef.current !== taskId || signal.aborted) {
            resolve();
            return;
          }

          const position = Math.min(
            frames.length - 1,
            Math.floor((now - startedAt) / frameDuration),
          );

          decodeAhead(position);

          if (position !== lastPosition) {
            // Кадра может не быть (битый или не успел распаковаться) — держим
            // предыдущий: пропуск заметен меньше, чем остановка анимации.
            const bitmap = touchDecodedFrame(store, frames[position]);
            if (bitmap) drawFrame(bitmap);
            lastPosition = position;
          }

          if (position >= frames.length - 1) {
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
      const store = storeRef.current;
      const controller = abortRef.current;

      if (!enabled || !store || !controller) return;
      if (state.status !== "ready" || targetViewIndex === state.currentViewIndex) return;

      const currentView = GENPLAN_VIEWS[state.currentViewIndex];
      const targetView = GENPLAN_VIEWS[targetViewIndex];
      if (!currentView || !targetView) return;

      const taskId = taskIdRef.current + 1;
      taskIdRef.current = taskId;
      const { signal } = controller;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const arc = getFrameRange(currentView.frameIndex, targetView.frameIndex);
      // Кадры перехода догружаются в фоне: пока их нет — переключаемся сразу,
      // без анимации. Интерактив не ждёт раскадровку (PERF-001).
      const canAnimate = !reducedMotion && isArcPlayable(store, arc);

      if (canAnimate) {
        setState((previous) => ({ ...previous, status: "playing", error: null }));

        // Разгон: первые кадры распаковываем до старта, чтобы анимация
        // не начиналась с пропусков.
        await Promise.allSettled(
          arc
            .slice(0, Math.min(arc.length, DECODE_LOOKAHEAD))
            .map((frameIndex) => decodeFrame(store, frameIndex, signal)),
        );
        if (taskIdRef.current !== taskId || signal.aborted) return;

        await playArc(store, signal, arc, taskId);
        if (taskIdRef.current !== taskId || signal.aborted) return;
      }

      const bitmap =
        (await decodeFrame(store, targetView.frameIndex, signal)) ??
        // Опорный кадр мог не дойти при первой загрузке — пробуем ещё раз,
        // чтобы ракурс не оставался пустым.
        (await loadAnchorFrame(store, targetView.frameIndex, signal));
      if (taskIdRef.current !== taskId || signal.aborted) return;

      if (bitmap) drawFrame(bitmap);
      focusFrameRef.current = targetView.frameIndex;

      setState({
        currentViewIndex: targetViewIndex,
        status: "ready",
        progress: 1,
        error: null,
      });
    },
    [drawFrame, enabled, playArc, state.currentViewIndex, state.status],
  );

  useEffect(() => {
    if (!enabled) return;

    const store = createFrameStore();
    const controller = new AbortController();
    const { signal } = controller;
    storeRef.current = store;
    abortRef.current = controller;

    const taskId = taskIdRef.current + 1;
    taskIdRef.current = taskId;
    const isStale = () => signal.aborted || taskIdRef.current !== taskId;

    focusFrameRef.current = GENPLAN_VIEWS[0].frameIndex;

    void (async () => {
      // Фаза 1. Только опорные кадры — после них сцена интерактивна, и ровно
      // по ним считается индикатор загрузки.
      let loaded = 0;

      await Promise.allSettled(
        GENPLAN_ANCHOR_FRAME_INDICES.map(async (frameIndex) => {
          const bitmap = await loadAnchorFrame(store, frameIndex, signal);
          if (isStale() || !bitmap) return;

          loaded += 1;
          const progress = loaded / GENPLAN_ANCHOR_FRAME_INDICES.length;
          setState((previous) =>
            previous.status === "loading" ? { ...previous, progress } : previous,
          );
        }),
      );
      if (isStale()) return;

      const firstFrame = touchDecodedFrame(store, GENPLAN_VIEWS[0].frameIndex);
      const anchorsReady = GENPLAN_ANCHOR_FRAME_INDICES.every((frameIndex) =>
        store.decoded.has(frameIndex),
      );

      // Опорные кадры критичны: без них у ракурсов нет состояний покоя.
      if (!firstFrame || !anchorsReady) {
        setState({
          currentViewIndex: 0,
          status: "error",
          progress: 0,
          error: "Не удалось загрузить виды дома. Обновите страницу.",
        });
        return;
      }

      drawFrame(firstFrame);
      setState({ currentViewIndex: 0, status: "ready", progress: 1, error: null });

      // Фаза 2. Остальные кадры нужны только для анимации перехода — тянем их
      // в фоне, уже интерактивной страницей.
      void prefetchFrames(store, signal, () => focusFrameRef.current);
    })();

    return () => {
      taskIdRef.current += 1;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // Обрываем загрузки «в полёте» и освобождаем кадры: раньше раскадровка
      // оставалась в памяти вкладки после ухода со страницы (PERF-004).
      controller.abort();
      releaseFrameStore(store);

      if (storeRef.current === store) storeRef.current = null;
      if (abortRef.current === controller) abortRef.current = null;
    };
  }, [drawFrame, enabled]);

  return {
    canvasRef,
    state,
    goToView,
  };
}
