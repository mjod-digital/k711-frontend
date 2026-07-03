---
name: rubber-system
description: "k711 — «резина»: desktop-first + fluid() = calc(px/var(--vw-screen)*100vw), корень 16px"
metadata: 
  node_type: memory
  type: project
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

«Резина» k711 (стиль как у mamison-resort.ru) — весь макет тянется пропорционально вьюпорту, **бесконечно** (без cap), без `clamp`. **Desktop-first.**

Механизм:
- SCSS-функция в `src/styles/_breakpoints.scss`: `@function fluid($px) { @return calc(#{$px} / var(--vw-screen) * 100 * 1vw); }`. Пишем размеры как `fluid(20)` (= 20px из Figma).
- `--vw-screen` — ширина артборда, в `globals.scss`: база (десктоп) `1440`, мобайл `@media (max-width:767.98px){ :root{ --vw-screen: 360 } }`. На опорной ширине `fluid(px) == px`.
- **Корневой `font-size` НЕ трогаем** (остаётся 16px) ⇒ устойчиво к browser «минимальный размер шрифта» (в отличие от прежнего vw-в-корне/`1rem=1px`, который ломался). Резина живёт в `calc(...vw)` на значениях, а не в rem×root.

Правила:
- Все размеры — `fluid(figmaPx)`. Бордеры-хайрлайны — `1px`. letter-spacing — `em`. line-height — unitless или `fluid()` (длина). aspect-ratio/`%`/`100svh` — как есть. Слайдер — прямой `vw`.
- **ВАЖНО:** внутри CSS-custom-property Sass НЕ вычисляет функции — `fluid()` в `--x:` надо оборачивать интерполяцией: `--fs-h1: #{fluid(120)};`. В обычных свойствах — без `#{}`: `padding: fluid(20);`.
- Брейкпоинт 768 (`$bp-desktop`), миксины: `@include mobile { @media (max-width:767.98px) }` (основной, desktop-first), `@include desktop { min-width:768 }` (редко).
- Каждый scss с `fluid()`/`@include` начинается с `@use "breakpoints" as *;`.

Замеры (подтверждено): root=16px на всех ширинах; H1=44px@360, 64px@768, 120px@1440, 160px@1920, 213px@2560. Пропорция «текст↔экран» постоянна внутри диапазона (12.22% мобайл / 8.33% десктоп). 1440 и 360 — пиксель-в-пиксель с Figma.

Капа на больших экранах НЕТ (обсуждали `min(100vw,1440px)`, но решили оставить бесконечно). Если понадобится — менять делитель/добавлять кэп в `fluid()` или `--vw-screen`. См. [[landing-structure]].

**Горизонтальное переполнение / «пустая полоса справа»:** `vw`-единицы включают ширину скроллбара, поэтому полноширинные `vw`-элементы (особенно крупные заголовки) на ~scrollbar-width шире контентной области → горизонтальный скролл. Лечим глобально: `main { overflow-x: clip }` в `globals.scss` — `clip` (НЕ `hidden`!) гасит переполнение и НЕ ломает `position: sticky` (пины Showcase/GalleryStrip живы). Отдельная ловушка (была в Terraces `.heading`): у `position:absolute` + `width:100%` ширина = padding-box контейнера, а позиция — от контента → вылезает на величину padding; чинить `left:0; right:0` вместо `width:100%`.
