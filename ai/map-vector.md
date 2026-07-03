---
name: map-vector
description: "Location map is an inline-SVG component (MapVector) assembled from Figma, not a raster"
metadata: 
  node_type: memory
  type: project
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

`src/components/ui/MapVector` — район-карта как **инлайн SVG** (вместо растра `map-empty.png`, который удалён). Используется в `Location` (`<MapVector className={styles.mapImg}/>`), переиспользуема для будущей страницы `/location` ([[multipage-plan]]).

- Собрана из Figma-ноды **277-16701** (файл inner-страниц `QwVmYGnU6CMJAUy34MwToo`). Нода — композит: база-улицы (белые `stroke`, `fill:none`) + ~28 векторных оверлеев (парки `#CFD7C7`, вода `#8F9EB3`, кольцо Садовое) + 16 повёрнутых подписей улиц (`#b0725f`, шрифт `--font-body`). Всё ВЕКТОР (не растр), ~33KB.
- Сборка: каждый кусок — вложенный `<svg x y width height viewBox preserveAspectRatio="none" fill="none">` в мастер `<svg viewBox="0 0 1440 860" preserveAspectRatio="xMidYMid slice">`; подписи — `<text>` с `rotate` вокруг центра контейнера. **Gotcha:** Figma-экспорт даёт `fill:none` только на корневом `<svg>` (наследование); при дроблении на куски надо ставить `fill="none"` на каждую вложенную `<svg>`, иначе stroke-only пути (улицы/кольцо) заливаются чёрным по умолчанию.
- Данные лежат строкой в `MapVector/mapData.ts` (`MAP_INNER`), рендерятся через `dangerouslySetInnerHTML` (контент статичный, безопасно) — чтобы не конвертировать kebab-атрибуты SVG в JSX.
- Поверх карты — перетаскиваемый слой `.pan` с интерактивными пинами (без изменений); карта проявляется по IntersectionObserver (`.dropped`), работает и под Lenis ([[inertial-scroll]]).
