---
name: figma-design-source
description: "Figma design file and node for the project's design tokens"
metadata: 
  node_type: memory
  type: reference
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

Макеты проекта в Figma (десктоп 1440, мобилка 360):
https://www.figma.com/design/QwVmYGnU6CMJAUy34MwToo/-cl--Климашкина--Copy-?node-id=277-16678&m=dev

Ноды с дизайн-токенами: **277-16678** (десктоп 1440) и **277-16963** (мобайл 360). Палитра одинакова на обоих; типографика отличается → собрана в fluid-`clamp()` 360→1440 в `src/app/globals.scss`. Шрифты: TT Ricordi Allegria (заголовки, woff2) + CoFo Gothic (текст, otf) — подключены через `next/font/local` из `public/fonts` (CSS-переменные `--font-ricordi` / `--font-cofo`, маппятся на `--font-display` / `--font-body`). CoFo пока OTF (~167KB) — можно сжать в woff2.

Доступ к токенам — через Figma Dev Mode MCP server (локальный, `http://127.0.0.1:3845/mcp`), настроен в `.mcp.json`. Чтобы инструменты Figma появились в Claude Code, нужен перезапуск Claude Code. См. [[project-overview]].
