import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

/**
 * On-demand ревалидация для headless MODX.
 * Настрой в MODX плагин на событие OnDocFormSave, который шлёт POST сюда,
 * ПЕРЕДАВАЯ СЕКРЕТ В ЗАГОЛОВКЕ (а не в query — тот утекает в логи/Referer):
 *   POST /api/revalidate
 *   Header: x-revalidate-secret: <REVALIDATE_SECRET>
 *   Body:   { "path": "/", "tag": "resources" }
 */

// Заведомо слабые плейсхолдеры — не пускаем их в прод (SEC-004/SEC-008).
const PLACEHOLDER_SECRETS = new Set(["change-me", "local-dev-secret", ""]);

// Сравнение постоянного времени: длину сверяем отдельно, чтобы timingSafeEqual
// не бросал на разной длине, и не утекала длина через исключение.
function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET ?? "";

  // Fail-closed: без секрета или с плейсхолдером в проде эндпоинт недоступен.
  if (
    !expected ||
    (process.env.NODE_ENV === "production" && PLACEHOLDER_SECRETS.has(expected))
  ) {
    return NextResponse.json({ message: "not configured" }, { status: 503 });
  }

  // Предпочитаем заголовок; query оставлен как временный фолбэк для ещё не
  // обновлённого MODX-плагина — УБРАТЬ после миграции плагина на заголовок.
  const provided =
    request.headers.get("x-revalidate-secret") ??
    request.nextUrl.searchParams.get("secret") ??
    "";

  if (!secretsMatch(provided, expected)) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  const { path, tag } = (await request.json().catch(() => ({}))) as {
    path?: string;
    tag?: string;
  };

  // Next 16: revalidateTag требует профиль кэша вторым аргументом.
  if (tag) revalidateTag(tag, "max");
  if (path) revalidatePath(path);

  return NextResponse.json({ revalidated: Boolean(tag || path) });
}
