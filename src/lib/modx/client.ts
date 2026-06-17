import "server-only";

const MODX_API_URL = process.env.MODX_API_URL;
const MODX_API_TOKEN = process.env.MODX_API_TOKEN;

type QueryValue = string | number | boolean | undefined | null;

type ModxFetchOptions = {
  /** Query-параметры запроса. */
  params?: Record<string, QueryValue>;
  /**
   * Кэш Next.js:
   *  - число  → ISR: ревалидация раз в N секунд (по умолчанию 60);
   *  - false  → без кэша (cache: "no-store"), всегда свежие данные.
   */
  revalidate?: number | false;
  /** Теги кэша для точечной ревалидации через revalidateTag(). */
  tags?: string[];
};

/**
 * Низкоуровневый клиент MODX REST API.
 * Зовётся только на сервере (Server Components / route handlers) —
 * токен не попадает в браузер.
 */
export async function modxFetch<T>(
  path: string,
  options: ModxFetchOptions = {},
): Promise<T> {
  if (!MODX_API_URL) {
    throw new Error(
      "MODX_API_URL не задан. Заполни .env.local (см. .env.example).",
    );
  }

  const base = MODX_API_URL.endsWith("/") ? MODX_API_URL : `${MODX_API_URL}/`;
  const url = new URL(path.replace(/^\//, ""), base);

  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const init: RequestInit & {
    next?: { revalidate?: number; tags?: string[] };
  } = {
    headers: {
      "Content-Type": "application/json",
      ...(MODX_API_TOKEN
        ? { Authorization: `Bearer ${MODX_API_TOKEN}` }
        : {}),
    },
  };

  if (options.revalidate === false) {
    init.cache = "no-store";
  } else {
    init.next = { revalidate: options.revalidate ?? 60, tags: options.tags };
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(
      `MODX API ${response.status} ${response.statusText} — ${url.pathname}`,
    );
  }

  return response.json() as Promise<T>;
}
