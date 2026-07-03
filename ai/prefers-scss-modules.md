---
name: prefers-scss-modules
description: User prefers SCSS Modules over Tailwind for styling
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

Для фронтенда пользователь предпочитает **SCSS Modules (.module.scss)** и явно **не хочет Tailwind**. Tailwind был удалён из скаффолда `create-next-app`.

**Why:** личное предпочтение по организации стилей; хочет локально-скоупленные стили и SCSS-возможности (миксины/переменные/вложенность).

**How to apply:** при создании компонентов класть рядом `*.module.scss`; брейкпоинт держать в SCSS-миксине; дизайн-токены — в CSS-переменных `:root`. См. [[project-overview]].
