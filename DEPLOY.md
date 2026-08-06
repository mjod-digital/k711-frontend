# Деплой k711 (production)

Прод: **www.klimashkina711.ru**. Один nginx фронтит и headless **MODX** (CMS), и
Next.js-фронтенд. Схема выкладки — **blue-green, zero-downtime**.

> Конкретный хост и SSH-доступ держит **владелец проекта** (детали — в
> `ai/prod-deployment.md`). В этот файл host/креды намеренно не вынесены —
> ниже только процедура. Плейсхолдер `<user>` — прод-пользователь сервера.

## Топология

- **GREEN (боевой):** `~/app-new` — Next 16, собран под **Node 22** (nvm),
  `next start` на `127.0.0.1:3001`. Отдельный pm2-демон:
  `PM2_HOME=/home/<user>/.pm2-node22`, процесс `k711`, systemd-юнит `pm2-k711.service`.
- **BLUE (rollback, ожидает вывода):** `~/app` — ДРУГОЙ старый проект (Next 15, Node 18)
  на `:3000` под дефолтным pm2-демоном (`~/.pm2`). Держится как мгновенный откат.

## Выкладка (GREEN)

1. rsync рабочего дерева → `~/app-new`, исключая `.git`, `node_modules`, `.next`.
2. Под Node 22 (`nvm use 22`), с выставленным `PM2_HOME=/home/<user>/.pm2-node22`:
   ```bash
   npm ci --include=dev && npm run build
   ```
   - **`--include=dev` обязателен:** `sass` — devDependency; прод-install её выкинет и
     сломает сборку.
   - Сборка ходит в MODX (`generateStaticParams` тянет `/api/flats`) →
     **MODX должен быть поднят на момент сборки.**
3. Перезапустить процесс `k711` в node22-pm2 (`pm2 restart k711`), `pm2 save`.

## nginx (`/etc/nginx/sites-available/default`)

- `upstream nextjs_app { server 127.0.0.1:3001; }`
- `location /` → upstream (Next).
- `location = /api/lead`, `location = /api/revalidate` → upstream (собственные роуты Next).
- `/api/flats|flat|floor`, `/manager`, `*.php`, `/assets/` → **MODX, не трогаем.**
- Байт-бэкап конфига: `/root/nginx-default.bak-<дата>`.

## Откат

Восстановить бэкап nginx → `nginx -t && systemctl reload nginx` (graceful reload,
старое приложение всё ещё на `:3000`).

> **Не** откатывать простым переключением порта в `upstream` — тогда точный
> `location = /api/lead` останется на старом приложении и отдаст 404.

## Дисциплина подключения

- nvm прописан в `~/.bashrc` → новый shell по умолчанию Node 22 + node22-pm2. Заново
  нужно только `export PM2_HOME=/home/<user>/.pm2-node22`.
- **Никогда** не запускать node22-pm2 (v7) против старого демона `~/.pm2` (v6): он может
  перезапустить старое приложение. Старое приложение трогать только СИСТЕМНЫМ pm2
  (`/usr/local/bin/pm2` или сначала `nvm deactivate`).

## Формы / лиды

Лиды идут через **CoMagic** (`Comagic.addOfflineRequest`, клиентский скрипт в
`layout.tsx`) → `src/lib/comagic.ts` `sendLead()`; `/api/lead` — серверный бэкап.
CoMagic требует включённого компонента «Консультант» в аккаунте.

> ⚠️ На момент аудита доставка лидов не была durable — см. [KNOWN-ISSUES.md](KNOWN-ISSUES.md)
> (ARCH-001 / UI-001 / DATA-002).
