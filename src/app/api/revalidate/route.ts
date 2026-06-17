import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

/**
 * On-demand ревалидация для headless MODX.
 * Настрой в MODX плагин на событие OnDocFormSave, который шлёт POST сюда:
 *   POST /api/revalidate?secret=...   body: { "path": "/", "tag": "resources" }
 */
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
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
