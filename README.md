# k711 — клубный дом Климашкина 7/11

Резиновый (fluid) премиум-лендинг: **Next.js 16** (App Router) · **React 19** · **TypeScript** ·
**SCSS Modules** (без Tailwind) · headless **MODX** как CMS · инерционный скролл на **Lenis**.
Прод — blue-green на `klimashkina711.ru` (см. [DEPLOY.md](DEPLOY.md)).

> ⚠️ Это Next.js **16** — API и конвенции отличаются от привычных. Перед правкой кода,
> завязанного на фреймворк, смотри локальные доки в `node_modules/next/dist/docs/`
> (см. [AGENTS.md](AGENTS.md)).

## Требования

- **Node.js 22** (зафиксировано в [.nvmrc](.nvmrc); прод собирается под Node 22). `nvm use` подхватит.
- npm (lockfile — npm).

## Быстрый старт

```bash
nvm use                 # Node 22
npm ci                  # установка по lockfile
cp .env.example .env.local   # заполнить переменные (см. ниже)
npm run dev             # http://localhost:3000
```

**Без своего MODX** проще всего поднять каталог квартир из снимка в коде — сетевые
зависимости не нужны:

```bash
APARTMENTS_SOURCE=mock npm run dev
```

> Если `API_BASE_URL` не задан, приложение по умолчанию ходит в **боевой** контент-API
> (`https://www.klimashkina711.ru/api`). Для локальной разработки укажи свой MODX в
> `.env.local` либо работай в `APARTMENTS_SOURCE=mock`, чтобы не дёргать прод.

## Переменные окружения

Полный список с комментариями — в [.env.example](.env.example) (он коммитится). Кратко:

| Переменная | Назначение |
|---|---|
| `API_BASE_URL` | Базовый URL контент-API MODX (снип-эндпоинты `/flats`, `/flat`, `/floor`, `/contact`, `/<alias>`). Не задан → **прод**. |
| `APARTMENTS_SOURCE` | `api` (живой CRM) или `mock` (снимок `src/lib/flats.mock.ts`). Не задан → `api` (на Vercel-превью авто-`mock`). |
| `REVALIDATE_SECRET` | Секрет вебхука `/api/revalidate` (передаётся заголовком `x-revalidate-secret`). |

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | Дев-сервер (Turbopack), `:3000` |
| `npm run build` | Прод-сборка (тянет MODX на этапе `generateStaticParams`) |
| `npm run start` | Запуск прод-сборки |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Структура

```
src/
  app/            App Router: папка-на-роут (page.tsx + <route>.module.scss),
                  globals.scss (дизайн-токены), api/{lead,revalidate} — route handlers
  components/
    layout/       Header, Footer, SmoothScroll (Lenis), Preloader-new
    sections/     блоки страниц (Hero, Showcase, ApartmentCatalog, …)
    ui/           примитивы (Reveal, GalleryStrip, Slider, Modal, CountUp, …)
  lib/            api.ts (MODX fetch + маппинг + fallback), apartments.ts,
                  flats.mock.ts, comagic.ts, url.ts (safeUrl), utils.ts (cn)
  config/site.ts  бренд/навигация/контакты
  store/          zustand: favorites (persist), booking (transient)
  styles/         _breakpoints.scss (fluid(), миксины), _reset.scss
```

## Ключевые концепции (детали — в `ai/`)

- **«Резина» / fluid-система.** Один брейкпоинт **768px** (макеты 360 и 1440). Функция
  `fluid($px)` (`src/styles/_breakpoints.scss`) масштабирует по ширине через
  `--vw-screen`/`--fvw`; выше 1440 масштаб замораживается. Десктоп-first, без `clamp`.
  См. [ai/rubber-system.md](ai/rubber-system.md).
- **Инерционный скролл.** Глобальный Lenis (`src/components/layout/SmoothScroll.tsx`),
  доступен как `window.__lenis`. Пин-секции (`GalleryStrip`, каталог) читают нативную
  позицию. См. [ai/inertial-scroll.md](ai/inertial-scroll.md), [ai/pinned-gallery.md](ai/pinned-gallery.md).
- **CMS fallback-first.** Каждая страница: `const ALIAS` → `fetchPage(ALIAS)` → хелперы
  `txt()`/`img()`/`cmsSlides()`. Любой сбой MODX → страница рендерится на хардкод-дефолтах,
  не падает (`src/lib/api.ts`).
- **Каталог квартир.** `ApartmentCatalog` — фильтры (draft/applied + URL-синк) + пин-скролл.
  Источник данных — `API_BASE_URL/flats` или mock (`APARTMENTS_SOURCE`).

## Данные / CMS

Контент правится в MODX и отдаётся снип-эндпоинтами (`/api/<alias>` → `{ texts, images,
lists, meta }`). Данные с внешней границы валидируются в `src/lib/api.ts` (числовые поля
каталога обязаны быть конечными числами, иначе строка отбрасывается) и имеют таймаут на
запрос. Каталог квартир (`/api/flats`) — отдельный CRM-фид.

## Деплой

Blue-green на прод-сервере (nginx + pm2 под Node 22). Полный ранбук — [DEPLOY.md](DEPLOY.md).
Конкретный хост и SSH-доступ держит владелец проекта.

## Известные проблемы

Снапшот production-аудита (135 находок, включая showstopper по доставке лидов) —
[KNOWN-ISSUES.md](KNOWN-ISSUES.md). Полные детальные отчёты — локально в `.audit/` (не в git).

## Дополнительная документация

Проектные заметки (анимации, макеты, интеграции) — в [`ai/`](ai/) (`ai/README.md` — индекс).
