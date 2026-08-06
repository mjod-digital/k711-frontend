---
name: project-overview
description: k711 — fluid landing on Next.js with SCSS Modules and headless MODX
metadata: 
  node_type: memory
  type: project
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

**k711** — резиновый (fluid) лендинг.

- Стек: Next.js 16 (App Router, Turbopack, TS, `src/`, alias `@/*`), React 19, **SCSS Modules** (без Tailwind — см. [[prefers-scss-modules]]).
- Вёрстка: 2 макета — мобильный (360) и десктопный (1440). Один брейкпоинт **768px** (`src/styles/_breakpoints.scss`, миксин `desktop`). Fluid-токены на `clamp()`, интерполяция 360→1440, в `:root` в `src/app/globals.scss`.
- Структура: `app/` (роутинг) · `components/{ui,sections,layout}` (папка-на-компонент) · `lib/` · `config/site.ts`.
- Бэкенд: **headless MODX** через снип-эндпоинты (`/api/<alias>`, `/api/flats`…). Слой данных — `src/lib/api.ts` (fetch + маппинг + fallback-first + рантайм-валидация + таймаут), env `API_BASE_URL`/`APARTMENTS_SOURCE` (см. `.env.example`), on-demand ревалидация `src/app/api/revalidate/route.ts` (Next 16: `revalidateTag(tag, "max")`). (Старый неиспользуемый слой `src/lib/modx/*` удалён при передаче.)
- Дизайн-токены тянем из Figma — см. [[figma-design-source]].
