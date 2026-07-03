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
- Бэкенд: **headless MODX** через REST API. Слой `src/lib/modx/` (client/resources/types), env `MODX_API_URL`/`MODX_API_TOKEN`, on-demand ревалидация `src/app/api/revalidate/route.ts` (Next 16: `revalidateTag(tag, "max")`). Точные пути эндпоинтов MODX — TODO, зависят от REST-коннектора.
- Дизайн-токены тянем из Figma — см. [[figma-design-source]].
