---
name: prod-deployment
description: "k711 prod on klimashkina711.ru — blue-green cutover done, new Next app on :3001 (Node 22); old app kept on :3000 as rollback, decommission pending"
metadata: 
  node_type: memory
  type: project
  originSessionId: d9731755-c336-4fbd-abea-b72adfe3beaf
---

Production for k711 is on `klimashkina@89.169.173.151` (domain www.klimashkina711.ru), where ONE nginx fronts both the headless **MODX** CMS and the Next.js frontend. On 2026-07-03 the current `k711` frontend was cut over live via **blue-green, zero downtime**.

- **New app (GREEN, live):** `~/app-new`, Next 16 built under **Node 22** (nvm), served by `next start` on **127.0.0.1:3001**. Runs in a SEPARATE pm2 daemon — `PM2_HOME=/home/klimashkina/.pm2-node22`, process name `k711`, ecosystem file in app-new, boot unit `pm2-k711.service`. Deploy = rsync working tree → `~/app-new` (exclude .git/node_modules/.next; repo carries ~535MB images so rsync is delta), then `npm ci --include=dev && npm run build` under Node 22. `--include=dev` is required (sass is a devDep; production install would drop it and break the build). Build hits MODX (`generateStaticParams` fetches /api/flats) — MODX must be up at build time.
- **Old app (BLUE, rollback, PENDING decommission):** `~/app` is a DIFFERENT older project ("klim", Next 15, Node 18), still running on **:3000** under the default pm2 daemon (`~/.pm2`, unit `pm2-klimashkina.service`). Phase 12 (not yet done): via the SYSTEM pm2 (node18, not the nvm one) `pm2 stop app && pm2 delete app && pm2 save && pm2 kill`, `pm2 unstartup`, then `mv ~/app ~/app-old-<date>`. Kept as instant rollback until soak confirms stability.
- **nginx** (`/etc/nginx/sites-available/default`): `upstream nextjs_app { server 127.0.0.1:3001; }`; `location /` → upstream; exact `location = /api/lead` & `= /api/revalidate` → upstream (Next's own routes); `/api/flats|flat|floor`, `/manager`, `*.php`, `/assets/` → **MODX, untouched**. Byte-backup: `/root/nginx-default.bak-20260702-235342`. Rollback = restore that backup + `nginx -t && systemctl reload nginx` (graceful reload, old app still on :3000). Do NOT roll back by only flipping the upstream port — that leaves `= /api/lead` pointing at the old app (404).

Reconnect discipline: nvm is in `~/.bashrc` so any new shell defaults to Node 22 + node22 pm2 — only `export PM2_HOME=/home/klimashkina/.pm2-node22` must be re-run. Never run the node22 pm2 (v7) against the old daemon `~/.pm2` (v6) — it can restart the old app; touch the old app only with the system pm2 (`/usr/local/bin/pm2` or `nvm deactivate` first).

Forms: all leads go through **CoMagic** `Comagic.addOfflineRequest` (client-side, script already in layout.tsx) via `src/lib/comagic.ts` `sendLead()`, with `/api/lead` kept as a server backup; booking leads include apartment №/area/floor/rooms/price in the message. CoMagic needs the "Consultant" component enabled in the account for addOfflineRequest to deliver. Map pin clicks were fixed by capturing the pointer lazily (past the 5px drag threshold) instead of on pointerdown.
