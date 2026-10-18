import { GENPLAN_ANCHOR_FRAME_INDICES, GENPLAN_FRAME_PATHS } from "./config";

// ───────────────────────────────────────────────────────────────────────────
// Кеш кадров раскадровки с ограниченной памятью (PERF-004).
//
// Распакованный кадр 1920×1080 занимает ~8,3 МБ, опорный 5000×2812 — ~56 МБ.
// Держать распакованной всю раскадровку — это ~2,1 ГБ вне JS-heap: вкладка
// начинает вытеснять кадры сама и пере-декодирует их синхронно посреди
// анимации. Поэтому кеш двухуровневый:
//   • сжатые кадры (Blob, ~200 КБ) — вся раскадровка это ~48 МБ, храним
//     целиком: не качаем повторно и знаем, готов ли переход к проигрыванию;
//   • распакованные (ImageBitmap) — узкое окно вокруг текущей позиции,
//     вытесненные закрываем через .close(); опорные кадры закреплены, это
//     состояния покоя сцены;
//   • на размонтировании загрузки обрываются, а кадры освобождаются.
// ───────────────────────────────────────────────────────────────────────────

/** Параллельных загрузок кадра: выше упираемся в лимит соединений к origin. */
const LOAD_CONCURRENCY = 4;

/**
 * Окно распакованных кадров поверх закреплённых опорных.
 * 24 × 8,3 МБ ≈ 200 МБ — потолок, на котором ещё нет вытеснения средствами
 * браузера, то есть нет синхронного пере-декодирования в середине анимации.
 */
const DECODED_FRAME_WINDOW = 24;

/**
 * Доля доступных кадров, ниже которой «анимация» выглядит как рывки:
 * честнее сразу показать целевой ракурс.
 */
const MIN_PLAYABLE_ARC_RATIO = 0.5;

const ANCHOR_FRAMES = new Set<number>(GENPLAN_ANCHOR_FRAME_INDICES);

export type FrameStore = {
  /** Сжатые кадры — источник правды о том, что уже скачано. */
  encoded: Map<number, Blob>;
  /** Распакованные кадры; порядок вставки = порядок обращения (LRU). */
  decoded: Map<number, ImageBitmap>;
  /** Кадры, которые не удалось получить или распаковать: не ждём и не ретраим. */
  broken: Set<number>;
  loading: Map<number, Promise<void>>;
  decoding: Map<number, Promise<void>>;
};

export function createFrameStore(): FrameStore {
  return {
    encoded: new Map(),
    decoded: new Map(),
    broken: new Set(),
    loading: new Map(),
    decoding: new Map(),
  };
}

export function releaseFrameStore(store: FrameStore) {
  // .close() отдаёт пиксели сразу: они живут вне JS-heap, и GC их не торопится
  // собирать — именно поэтому уход со страницы раньше ничего не освобождал.
  store.decoded.forEach((bitmap) => {
    bitmap.close();
  });
  store.decoded.clear();
  store.encoded.clear();
  store.broken.clear();
  store.loading.clear();
  store.decoding.clear();
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Отдаёт распакованный кадр и помечает его как «только что использованный». */
export function touchDecodedFrame(store: FrameStore, frameIndex: number) {
  const bitmap = store.decoded.get(frameIndex);
  if (!bitmap) return null;

  store.decoded.delete(frameIndex);
  store.decoded.set(frameIndex, bitmap);

  return bitmap;
}

function evictDecodedFrames(store: FrameStore) {
  let evictable = 0;
  store.decoded.forEach((_, frameIndex) => {
    if (!ANCHOR_FRAMES.has(frameIndex)) evictable += 1;
  });

  for (const [frameIndex, bitmap] of store.decoded) {
    if (evictable <= DECODED_FRAME_WINDOW) return;
    // Опорные кадры закреплены: это состояния покоя, их рисуем мгновенно.
    if (ANCHOR_FRAMES.has(frameIndex)) continue;

    store.decoded.delete(frameIndex);
    bitmap.close();
    evictable -= 1;
  }
}

export async function fetchFrame(
  store: FrameStore,
  frameIndex: number,
  signal: AbortSignal,
  isAnchor = false,
): Promise<void> {
  if (store.encoded.has(frameIndex) || store.broken.has(frameIndex)) return;

  const inFlight = store.loading.get(frameIndex);
  if (inFlight) return inFlight;

  const source = GENPLAN_FRAME_PATHS[frameIndex];
  if (!source) {
    store.broken.add(frameIndex);
    return;
  }

  const request = (async () => {
    try {
      // Фоновые кадры намеренно низкоприоритетны: они не должны конкурировать
      // ни с опорными кадрами, ни с остальной страницей.
      const response = await fetch(source, { signal, priority: isAnchor ? "high" : "low" });
      if (!response.ok) throw new Error(`HTTP ${response.status} — ${source}`);

      const blob = await response.blob();
      if (signal.aborted) return;

      store.encoded.set(frameIndex, blob);
    } catch (error) {
      // Отмена при размонтировании — не поломка.
      if (signal.aborted || isAbortError(error)) return;

      // Один кадр из 238 не должен ронять сцену: помечаем и идём дальше.
      store.broken.add(frameIndex);
      console.error(`[genplan] кадр ${frameIndex} не загрузился`, error);
    } finally {
      store.loading.delete(frameIndex);
    }
  })();

  store.loading.set(frameIndex, request);

  return request;
}

export async function decodeFrame(
  store: FrameStore,
  frameIndex: number,
  signal: AbortSignal,
): Promise<ImageBitmap | null> {
  const cached = touchDecodedFrame(store, frameIndex);
  if (cached) return cached;

  const inFlight = store.decoding.get(frameIndex);
  if (inFlight) {
    await inFlight;
    return touchDecodedFrame(store, frameIndex);
  }

  const blob = store.encoded.get(frameIndex);
  if (!blob) return null;

  const request = (async () => {
    try {
      const bitmap = await createImageBitmap(blob);
      if (signal.aborted) {
        bitmap.close();
        return;
      }

      store.decoded.set(frameIndex, bitmap);
      evictDecodedFrames(store);
    } catch (error) {
      if (signal.aborted || isAbortError(error)) return;

      // Битый кадр не кешируем: иначе он считался бы загруженным и рисовал пустоту.
      store.encoded.delete(frameIndex);
      store.broken.add(frameIndex);
      console.error(`[genplan] кадр ${frameIndex} не распаковался`, error);
    } finally {
      store.decoding.delete(frameIndex);
    }
  })();

  store.decoding.set(frameIndex, request);
  await request;

  return touchDecodedFrame(store, frameIndex);
}

/**
 * Опорный кадр критичен — без него у ракурса нет состояния покоя, поэтому
 * одна повторная попытка. Промежуточные кадры не ретраим: они не обязательны.
 */
export async function loadAnchorFrame(
  store: FrameStore,
  frameIndex: number,
  signal: AbortSignal,
) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await fetchFrame(store, frameIndex, signal, true);
    if (signal.aborted) return null;

    const bitmap = await decodeFrame(store, frameIndex, signal);
    if (bitmap || signal.aborted) return bitmap;

    store.broken.delete(frameIndex);
  }

  return null;
}

/** Готов ли перегон кадров к проигрыванию: ждать нечего и смотреть есть на что. */
export function isArcPlayable(store: FrameStore, frames: number[]) {
  let available = 0;

  for (const frameIndex of frames) {
    if (store.encoded.has(frameIndex) || store.decoded.has(frameIndex)) {
      available += 1;
      continue;
    }

    // Кадр ещё качается — анимировать рано, иначе получим рывки.
    if (!store.broken.has(frameIndex)) return false;
  }

  return available >= Math.ceil(frames.length * MIN_PLAYABLE_ARC_RATIO);
}

function takeNearestFrame(pending: Set<number>, focusFrame: number) {
  let nearest: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const frameIndex of pending) {
    const distance = Math.abs(frameIndex - focusFrame);
    if (distance >= bestDistance) continue;

    bestDistance = distance;
    nearest = frameIndex;
  }

  if (nearest !== null) pending.delete(nearest);

  return nearest;
}

/** Фоновая догрузка остальных кадров: ближайшие к текущему ракурсу — первыми. */
export async function prefetchFrames(
  store: FrameStore,
  signal: AbortSignal,
  getFocusFrame: () => number,
) {
  const pending = new Set<number>();
  GENPLAN_FRAME_PATHS.forEach((_, frameIndex) => {
    if (ANCHOR_FRAMES.has(frameIndex) || store.encoded.has(frameIndex)) return;
    pending.add(frameIndex);
  });

  const worker = async () => {
    while (!signal.aborted) {
      const frameIndex = takeNearestFrame(pending, getFocusFrame());
      if (frameIndex === null) return;

      await fetchFrame(store, frameIndex, signal);
    }
  };

  // allSettled, а не all: упавший кадр не должен обрывать догрузку остальных.
  await Promise.allSettled(
    Array.from({ length: Math.min(LOAD_CONCURRENCY, pending.size) }, () => worker()),
  );
}
