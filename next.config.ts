import type { NextConfig } from "next";
import path from "node:path";

// Разрешённые источники сторонних скриптов (аналитика/трекеры из layout.tsx).
// Пока CSP отдаётся в Report-Only (только репорты в консоль, ничего не блокирует),
// чтобы обкатать политику без риска сломать загрузку скриптов. После проверки
// нарушений в проде переключить заголовок на "Content-Security-Policy".
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  // GTM/Метрика/Mindbox/AdRiver вставляют inline-снипеты и подгружают код.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://mc.yandex.ru https://api.mindbox.ru https://content.adriver.ru https://*.comagic.ru https://*.comagic.dev",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://s3.mastertel.ru https://www.klimashkina711.ru https://mc.yandex.ru https://www.googletagmanager.com https://content.adriver.ru",
  "font-src 'self'",
  "connect-src 'self' https://mc.yandex.ru https://api.mindbox.ru https://content.adriver.ru https://*.comagic.ru https://*.comagic.dev",
  "frame-src 'self' https://www.googletagmanager.com https://mc.yandex.ru",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Базовые security-заголовки (SEC-001). Отдаются на все маршруты.
const SECURITY_HEADERS = [
  // preload осознанно НЕ ставим: он необратимо коммитит все поддомены на HTTPS
  // (в т.ч. cms/admin). includeSubDomains достаточно для лендинга на одном домене.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

// Долгий immutable-кэш для статики из /public (PERF-009). Имена файлов
// контентно-стабильны, перед фронтом нет CDN → возвращающиеся посетители
// не перекачивают шрифты/картинки/PDF.
const IMMUTABLE_CACHE = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const nextConfig: NextConfig = {
  // Убираем x-powered-by: Next (PERF-023 / мелкая утечка стека).
  poweredByHeader: false,
  sassOptions: {
    // Современный Sass API (Next 16) использует loadPaths.
    // Позволяет писать `@use "breakpoints" as *;` без относительных путей.
    loadPaths: [path.join(process.cwd(), "src/styles")],
  },
  images: {
    // AVIF предпочтительнее WebP (~20-30% меньше для фото); WebP как фолбэк (PERF-008).
    formats: ["image/avif", "image/webp"],
    // Self-hosted origin: без длинного TTL оптимизатор пере-кодирует тяжёлые
    // исходники PNG слишком часто. 31 день.
    minimumCacheTTL: 2678400,
    // Next 16 требует allowlist качеств. Используем только дефолтное 75.
    qualities: [75],
    // Планировки квартир приходят из CRM (внешний S3).
    remotePatterns: [
      { protocol: "https", hostname: "s3.mastertel.ru" },
      { protocol: "https", hostname: "www.klimashkina711.ru" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/images/:path*", headers: IMMUTABLE_CACHE },
      { source: "/fonts/:path*", headers: IMMUTABLE_CACHE },
      { source: "/pdf/:path*", headers: IMMUTABLE_CACHE },
    ];
  },
};

export default nextConfig;
