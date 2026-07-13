// Валидация схемы URL перед выводом значений из CRM/CMS в href/src (SEC-005).
// Блокирует javascript:/vbscript:/data:text-html и прочие XSS-векторы на случай,
// если бэкенд скомпрометирован или редактор вставил враждебный URI.
// Разрешаем: относительные пути сайта, http(s), mailto, tel и data:image/* (для картинок).

const SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;

/**
 * Возвращает URL, если он безопасен, иначе "" (пустая ссылка — «мёртвый» клик,
 * а не исполнение скрипта). Для картинок дополнительно допускает data:image/*.
 */
export function safeUrl(url: string | null | undefined): string {
  if (!url) return "";
  const s = String(url).trim();
  if (!s) return "";
  // Site-relative путь (но не protocol-relative "//host").
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  // Верифицированные data-URI картинок (для <img>/next/image).
  if (/^data:image\//i.test(s)) return s;
  if (SAFE_SCHEME.test(s)) return s;
  return "";
}
