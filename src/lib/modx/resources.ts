import { modxFetch } from "./client";
import type { ModxResource, ModxListResponse } from "./types";

/**
 * Типизированные обёртки над MODX REST.
 *
 * TODO: пути эндпоинтов ("resource" / "resources") зависят от твоего
 * REST-коннектора в MODX. Поправь под реальный API.
 */

export function getResourceByAlias(alias: string) {
  return modxFetch<ModxResource>("resource", {
    params: { alias },
    revalidate: 60,
    tags: [`resource:${alias}`],
  });
}

export function getResourceById(id: number) {
  return modxFetch<ModxResource>("resource", {
    params: { id },
    revalidate: 60,
    tags: [`resource:${id}`],
  });
}

export function getResources(
  params: { parent?: number; limit?: number; offset?: number } = {},
) {
  return modxFetch<ModxListResponse<ModxResource>>("resources", {
    params,
    revalidate: 60,
    tags: ["resources"],
  });
}
