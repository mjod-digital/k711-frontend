#!/usr/bin/env bash
# k711 — выкладка фронтенда на прод.
#
# Схема: каждый коммит собирается в ОТДЕЛЬНЫЙ каталог-релиз, боевой путь ~/app-new —
# симлинк на текущий релиз. Переключение = pm2 stop → атомарная замена симлинка →
# pm2 start → проверка, что трафик обслуживает именно новая сборка. Сборка никогда
# не идёт в каталоге, который обслуживает трафик, поэтому работающий сервер не
# может подсунуть ей устаревший пререндер из .next/cache.
#
# Команды:
#   deploy.sh deploy <main|SHA>    собрать коммит из main в новый релиз и переключиться
#   deploy.sh rollback [RELEASE]   вернуть релиз, бывший на проде до текущего (или указанный)
#   deploy.sh status               текущий релиз, история, состояние
#   deploy.sh --ssh                режим forced command: команда из $SSH_ORIGINAL_COMMAND
#
# deploy и rollback выполняются в процессе, ОТВЯЗАННОМ от SSH-сессии (свой сеанс,
# вывод в файл); вызвавший процесс только транслирует лог. Обрыв соединения или
# отмена job в CI не прерывают выкладку посередине — она доходит до конца или
# откатывается сама.
#
# Модель доверия (честно): deploy выполняет код из репозитория (npm ci, next build,
# сам сайт) под пользователем приложения. Forced command ограничивает то, что можно
# сделать ключом CI НАПРЯМУЮ, но не то, что сделает выкладываемый коммит. Любой, кто
# может положить коммит в main и запустить выкладку, получает выполнение кода на
# сервере с правами этого пользователя. См. DEPLOY.md, «Модель доверия».

set -Eeuo pipefail
umask 022

# ---------- конфигурация (K711_* переопределяются только для тестов) ----------
ROOT="${K711_DEPLOY_ROOT:-$HOME/k711-deploy}"
APP_LINK="${K711_APP_LINK:-$HOME/app-new}"   # cwd процесса pm2 — симлинк на релиз
BRANCH="main"
GITHUB_KEY="${K711_GITHUB_KEY:-$HOME/.ssh/k711_github_deploy}"
PM2_APP="k711"
export PM2_HOME="${K711_PM2_HOME:-$HOME/.pm2-node22}"
NODE_MAJOR="22"
NODE_VERSIONS_DIR="${K711_NODE_VERSIONS_DIR:-$HOME/.nvm/versions/node}"
HEALTH_URL="${K711_HEALTH_URL:-http://127.0.0.1:3001/}"
MODX_PROBE_URL="${K711_MODX_PROBE_URL:-https://www.klimashkina711.ru/api/flats}"
KEEP_RELEASES="${K711_KEEP_RELEASES:-3}"      # сколько последних ЖИВЫХ релизов хранить (с текущим)
MIN_FREE_MB="${K711_MIN_FREE_MB:-2500}"       # релиз с node_modules и .next ≈ 1.1 ГБ
FETCH_DEPTH=50                                # глубина main, в пределах которой можно выкладывать SHA
HEALTH_TIMEOUT_S="${K711_HEALTH_TIMEOUT_S:-90}"

RELEASES="$ROOT/releases"
LOGS="$ROOT/logs"
REPO="$ROOT/repo.git"
HISTORY="$ROOT/deploys.log"            # все попытки: время, действие, релиз, коммит, результат
LIVE_LOG="$ROOT/live.log"              # только релизы, реально прошедшие проверку на проде
GITHUB_KNOWN_HOSTS="$ROOT/github_known_hosts"   # сверенный host key github.com (ставит install.sh)
SELF="$(readlink -f "${BASH_SOURCE[0]}")"

# Состояние текущей выкладки — глобальное, чтобы его видел EXIT-trap.
D_ID="" D_SHA="" D_REL="" D_STAGE="" D_STARTED=0

# ---------- утилиты ----------
say() { printf '[deploy %s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { say "ОШИБКА: $*" >&2; exit 1; }

usage() {
  cat >&2 <<'TXT'
Использование:
  deploy <main|SHA-40>    выложить коммит из main
  rollback [RELEASE]      вернуть предыдущий живой или указанный релиз
  status                  состояние
TXT
  exit 2
}

trap 'say "сбой в строке $LINENO" >&2' ERR

# nvm.sh не совместим с set -euo pipefail — подключаем Node 22 напрямую через PATH.
use_node() {
  local -a bins=()
  local d
  for d in "$NODE_VERSIONS_DIR"/v"$NODE_MAJOR".*/bin; do if [[ -x "$d/node" ]]; then bins+=("$d"); fi; done
  (( ${#bins[@]} > 0 )) || die "не найден Node $NODE_MAJOR в $NODE_VERSIONS_DIR"
  PATH="$(printf '%s\n' "${bins[@]}" | sort -V | tail -n 1):$PATH"
  export PATH
  [[ "$(node -v)" == "v$NODE_MAJOR."* ]] || die "ожидался Node $NODE_MAJOR, а запускается $(node -v)"
  command -v pm2 >/dev/null || die "pm2 не установлен в Node $NODE_MAJOR"
}

take_lock() {
  mkdir -p "$RELEASES" "$LOGS"
  exec 9>"$ROOT/deploy.lock"
  flock -n 9 || die "уже идёт другая выкладка или откат — дождитесь её завершения"
}

current_release() {
  [[ -L "$APP_LINK" ]] || die "$APP_LINK не симлинк — сервер не подготовлен (deploy/install.sh)"
  local target
  target="$(readlink -f "$APP_LINK")"
  [[ "$(dirname "$target")" == "$(readlink -f "$RELEASES")" ]] \
    || die "$APP_LINK указывает за пределы $RELEASES: $target"
  [[ -d "$target" ]] || die "$APP_LINK указывает на несуществующий релиз: $target"
  basename "$target"
}

list_releases() {   # по возрастанию; имя начинается с отметки времени
  find "$RELEASES/" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort
}

free_mb() { df -Pm "$ROOT" | awk 'NR==2 {print $4}'; }

record() {   # время  действие  релиз  коммит  результат  длительность  откуда
  local from="${SSH_CLIENT:-local}"
  printf '%s\t%s\t%s\t%s\t%s\t%ss\t%s\n' "$(date -Is)" "$1" "$2" "$3" "$4" "$5" "${from%% *}" >> "$HISTORY"
}

mark_live() { printf '%s\t%s\n' "$(date -Is)" "$1" >> "$LIVE_LOG"; }

live_ids() { [[ -f "$LIVE_LOG" ]] && cut -f2 "$LIVE_LOG" || true; }

# Релиз, бывший на проде до текущего: идём по истории живых назад.
previous_live() {
  local current="$1" i
  local -a ids=()
  mapfile -t ids < <(live_ids)
  for (( i=${#ids[@]}-1; i>=0; i-- )); do
    [[ "${ids[i]}" == "$current" ]] && continue
    [[ -d "$RELEASES/${ids[i]}" ]] && { printf '%s\n' "${ids[i]}"; return 0; }
  done
  return 1
}

# Без пайпа: `… | grep -q` под pipefail даёт ложный отказ, когда grep выходит раньше
# и пишущий конец получает SIGPIPE.
is_live_release() { [[ -f "$LIVE_LOG" ]] && awk -F'\t' -v id="$1" '$2 == id {f=1} END {exit !f}' "$LIVE_LOG"; }

# pm2 должен запускать приложение с cwd = симлинк. Если процесс пересоздали из
# каталога релиза, pm2 запомнит реальный путь, и переключение симлинка перестанет
# на что-либо влиять — проверяем заранее, а не узнаём по «сборка не ответила».
check_pm2_cwd() {
  local cwd
  cwd="$(pm2 jlist 2>/dev/null | node -e '
    let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
      try { const a = JSON.parse(s.slice(s.indexOf("[")));
            const p = a.find(x => x.name === process.argv[1]);
            process.stdout.write(p ? String(p.pm2_env.pm_cwd) : "");
      } catch { process.stdout.write(""); }
    });' "$PM2_APP")"
  [[ -n "$cwd" ]] || die "pm2 не знает процесс $PM2_APP (PM2_HOME=$PM2_HOME)"
  [[ "$cwd" == "$APP_LINK" ]] || die "pm2 запускает $PM2_APP из $cwd, а должен из $APP_LINK — пересоздайте процесс с --cwd $APP_LINK (см. DEPLOY.md)"
}

# Атомарное переключение: rename() нового симлинка поверх старого.
switch_to() {
  rm -f -- "$APP_LINK.next"
  ln -sn "$RELEASES/$1" "$APP_LINK.next"
  mv -T "$APP_LINK.next" "$APP_LINK"
}

# Остановить процесс → переключить симлинк → запустить → убедиться, что трафик
# обслуживает ИМЕННО этот релиз (его BUILD_ID в HTML главной, Next кладёт "b":"…").
# Остановка ДО переключения: старый процесс не должен успеть прочитать или записать
# что-то в новом релизе, пока завершается.
activate_and_check() {
  local id="$1" build_id body deadline
  build_id="$(<"$RELEASES/$id/.next/BUILD_ID")"
  pm2 stop "$PM2_APP" >/dev/null
  switch_to "$id"
  pm2 start "$PM2_APP" >/dev/null
  deadline=$(( SECONDS + HEALTH_TIMEOUT_S ))
  while (( SECONDS < deadline )); do
    if body="$(curl -fsS -m 5 "$HEALTH_URL" 2>/dev/null)" && [[ "$body" == *"$build_id"* ]]; then
      say "проверка пройдена: трафик обслуживает $id (сборка $build_id)"
      return 0
    fi
    sleep 2
  done
  return 1
}

# Хранить текущий и последние живые релизы (всего KEEP_RELEASES); всё прочее —
# устаревшие и недособранные остатки — удалить. У нетекущих снести .next/cache.
prune() {
  local current="$1" id i
  local -A keep=(["$current"]=1)
  local -a ids=() all=()
  mapfile -t ids < <(live_ids)
  for (( i=${#ids[@]}-1; i>=0 && ${#keep[@]} < KEEP_RELEASES; i-- )); do
    [[ -d "$RELEASES/${ids[i]}" ]] && keep["${ids[i]}"]=1
  done
  mapfile -t all < <(list_releases)
  for id in "${all[@]}"; do
    if [[ -n "${keep[$id]:-}" ]]; then
      [[ "$id" != "$current" ]] && rm -rf -- "${RELEASES:?}/$id/.next/cache"
    else
      say "удаляю релиз $id"
      rm -rf -- "${RELEASES:?}/$id"
    fi
  done
  find "$LOGS" -maxdepth 1 -type f \( -name '*.log' -o -name 'job-*.out' \) -printf '%T@ %p\n' \
    | sort -rn | tail -n +61 | cut -d' ' -f2- | xargs -r rm -f --
}

# Проверки собранного релиза ДО переключения.
verify_build() {
  local rel="$1" index head marker
  [[ -s "$rel/.next/BUILD_ID" ]] || { say "в сборке нет .next/BUILD_ID" >&2; return 1; }
  index="$rel/.next/server/app/index.html"
  [[ -s "$index" ]] || { say "главная не пререндерилась: нет $index" >&2; return 1; }
  head="$(awk -v RS='<body' 'NR==1' "$index")"
  [[ "$head" =~ \<title\>[^\<]+\</title\> ]] || { say "у главной пустой <title>" >&2; return 1; }
  if [[ -f "$rel/deploy/head-markers.txt" ]]; then
    while IFS= read -r marker || [[ -n "$marker" ]]; do
      [[ -z "${marker//[[:space:]]/}" || "$marker" == \#* ]] && continue
      [[ "$head" == *"$marker"* ]] || { say "в <head> главной нет обязательной строки: $marker" >&2; return 1; }
    done < "$rel/deploy/head-markers.txt"
    say "обязательные строки в <head> главной на месте"
  fi
}

# Пока релиз не стал боевым, любой выход с ошибкой удаляет его и пишет в историю.
cleanup_failed_release() {
  local rc=$?
  (( rc == 0 )) && return 0
  [[ -n "$D_REL" && -d "$D_REL" ]] && rm -rf -- "$D_REL"
  record deploy "${D_ID:--}" "${D_SHA:--}" "fail:$D_STAGE" $((SECONDS - D_STARTED))
  say "выкладка прервана на этапе «$D_STAGE», прод не тронут${D_ID:+ (лог: $LOGS/$D_ID.log)}" >&2
}

# ---------- команды ----------
cmd_deploy() {
  local ref="$1" main_sha current current_rev log
  D_STARTED=$SECONDS D_STAGE="подготовка"
  take_lock
  trap cleanup_failed_release EXIT
  use_node
  current="$(current_release)"
  check_pm2_cwd
  [[ -s "$GITHUB_KNOWN_HOSTS" ]] || die "нет $GITHUB_KNOWN_HOSTS — запустите deploy/install.sh"

  prune "$current"
  (( $(free_mb) >= MIN_FREE_MB )) || die "мало места: $(free_mb) МБ свободно, нужно $MIN_FREE_MB"
  curl -fsS -m 20 -o /dev/null "$MODX_PROBE_URL" \
    || die "MODX не отвечает ($MODX_PROBE_URL) — без него сборка не пройдёт"

  D_STAGE="получение кода"
  say "получаю $BRANCH из GitHub"
  GIT_SSH_COMMAND="ssh -i $GITHUB_KEY -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$GITHUB_KNOWN_HOSTS -o GlobalKnownHostsFile=/dev/null" \
    git -C "$REPO" fetch --quiet --depth="$FETCH_DEPTH" origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH"
  main_sha="$(git -C "$REPO" rev-parse "refs/remotes/origin/$BRANCH^{commit}")"
  if [[ "$ref" == "main" ]]; then
    D_SHA="$main_sha"
  else
    D_SHA="$ref"
    git -C "$REPO" cat-file -e "$D_SHA^{commit}" 2>/dev/null \
      || die "коммит $D_SHA не найден в последних $FETCH_DEPTH коммитах $BRANCH"
    git -C "$REPO" merge-base --is-ancestor "$D_SHA" "$main_sha" \
      || die "коммит $D_SHA не входит в $BRANCH — выкладывать можно только из $BRANCH"
  fi
  # Защита от повторного запуска старого CI-прогона: коммит старше текущего на проде
  # выкладывать нельзя — для возврата назад есть rollback.
  current_rev="$(head -n1 "$RELEASES/$current/REVISION" 2>/dev/null || true)"
  if [[ "$current_rev" =~ ^[0-9a-f]{40}$ && "$D_SHA" != "$current_rev" ]] \
     && git -C "$REPO" cat-file -e "$current_rev^{commit}" 2>/dev/null \
     && git -C "$REPO" merge-base --is-ancestor "$D_SHA" "$current_rev"; then
    die "коммит $D_SHA старше того, что на проде ($current_rev) — для возврата используйте rollback"
  fi
  git -C "$REPO" gc --auto --quiet || true

  D_ID="$(date +%Y%m%d-%H%M%S)-${D_SHA:0:7}"
  D_REL="$RELEASES/$D_ID"
  log="$LOGS/$D_ID.log"
  say "релиз $D_ID (коммит $D_SHA), сейчас на проде: $current"
  mkdir "$D_REL"
  git -C "$REPO" archive "$D_SHA" | tar -x -C "$D_REL"
  printf '%s\n' "$D_SHA" > "$D_REL/REVISION"

  D_STAGE="npm ci"
  say "npm ci (лог: $log)"
  (cd "$D_REL" && npm ci --include=dev --no-audit --no-fund) >>"$log" 2>&1 \
    || { tail -n 40 "$log" >&2; die "npm ci упал"; }

  D_STAGE="сборка"
  say "next build"
  (cd "$D_REL" && npm run build) >>"$log" 2>&1 \
    || { tail -n 40 "$log" >&2; die "сборка упала"; }

  D_STAGE="проверка сборки"
  verify_build "$D_REL" || die "сборка не прошла проверку"

  D_STAGE="переключение"
  trap - EXIT   # дальше ошибки обрабатываются явно: с откатом, без удаления вслепую
  say "переключаю $APP_LINK → $D_ID"
  if ! activate_and_check "$D_ID"; then
    say "новая сборка не ответила за ${HEALTH_TIMEOUT_S}с — автооткат на $current" >&2
    if activate_and_check "$current"; then
      rm -rf -- "$D_REL"
      record deploy "$D_ID" "$D_SHA" "fail:health→откат" $((SECONDS - D_STARTED))
      die "выкладка $D_ID не прошла проверку, прод возвращён на $current (лог: $log, pm2 logs $PM2_APP)"
    fi
    record deploy "$D_ID" "$D_SHA" "fail:health+откат-не-прошёл" $((SECONDS - D_STARTED))
    die "не прошли проверку ни новая сборка, ни откат — нужен ручной разбор: pm2 logs $PM2_APP"
  fi

  mark_live "$D_ID"
  pm2 save >/dev/null
  prune "$D_ID"
  record deploy "$D_ID" "$D_SHA" ok $((SECONDS - D_STARTED))
  say "готово за $((SECONDS - D_STARTED))с: $D_ID"
}

cmd_rollback() {
  local target="${1:-}" started=$SECONDS current rev
  take_lock
  use_node
  current="$(current_release)"
  check_pm2_cwd
  if [[ -z "$target" ]]; then
    target="$(previous_live "$current")" || die "в истории нет релиза, бывшего на проде до $current"
  fi
  [[ -d "$RELEASES/$target" ]] || die "нет такого релиза: $target"
  [[ "$target" != "$current" ]] || die "$target уже на проде"
  is_live_release "$target" || die "релиз $target ни разу не проходил проверку на проде — откат на него запрещён"
  [[ -s "$RELEASES/$target/.next/BUILD_ID" ]] || die "у релиза $target нет сборки"
  rev="$(head -n1 "$RELEASES/$target/REVISION" 2>/dev/null || echo -)"

  say "откат: $current → $target"
  if ! activate_and_check "$target"; then
    activate_and_check "$current" || say "ВНИМАНИЕ: и возврат на $current не прошёл проверку — pm2 logs $PM2_APP" >&2
    record rollback "$target" "$rev" "fail:health" $((SECONDS - started))
    die "релиз $target не прошёл проверку — вернул $current"
  fi
  mark_live "$target"
  pm2 save >/dev/null
  record rollback "$target" "$rev" ok $((SECONDS - started))
  say "готово: на проде релиз $target"
}

cmd_status() {
  local current id prev
  current="$(current_release)"
  prev="$(previous_live "$current" || echo '—')"
  printf 'на проде      : %s\n' "$current"
  printf 'коммит        : %s\n' "$(head -n1 "$RELEASES/$current/REVISION" 2>/dev/null || echo '?')"
  printf 'BUILD_ID      : %s\n' "$(cat "$RELEASES/$current/.next/BUILD_ID" 2>/dev/null || echo '?')"
  printf 'rollback вернёт: %s\n' "$prev"
  printf 'свободно      : %s МБ\n\nрелизы (* на проде, L бывал на проде):\n' "$(free_mb)"
  while read -r id; do
    printf '  %s%s %s  %s\n' "$([[ "$id" == "$current" ]] && echo '*' || echo ' ')" \
      "$(is_live_release "$id" && echo L || echo ' ')" "$id" "$(head -n1 "$RELEASES/$id/REVISION" 2>/dev/null)"
  done < <(list_releases)
  printf '\nпоследние действия:\n'
  if [[ -f "$HISTORY" ]]; then tail -n 5 "$HISTORY" | sed 's/^/  /'; else echo '  —'; fi
}

# ---------- разбор команды ----------
validate() {
  case "${1:-}" in
    deploy)
      [[ $# -eq 2 ]] || usage
      [[ "$2" == "main" || "$2" =~ ^[0-9a-f]{40}$ ]] || die "ref: 'main' или полный SHA (40 hex-символов)" ;;
    rollback)
      [[ $# -le 2 ]] || usage
      [[ $# -eq 1 || "$2" =~ ^[0-9]{8}-[0-9]{6}-[0-9a-z]{6,12}$ ]] || die "неверное имя релиза" ;;
    status)
      [[ $# -eq 1 ]] || usage ;;
    *) usage ;;
  esac
}

# Запустить команду в отвязанном воркере и транслировать его вывод до завершения.
run_detached() {
  local job pid rc
  mkdir -p "$LOGS"
  job="$LOGS/job-$(date +%Y%m%d-%H%M%S)-$$"
  : > "$job.out"
  setsid "$SELF" --worker "$job" "$@" </dev/null >>"$job.out" 2>&1 &
  pid=$!
  tail -n +1 -f --pid="$pid" "$job.out" || true
  if [[ -s "$job.rc" ]]; then rc="$(<"$job.rc")"; rm -f -- "$job.rc"
  else rc=1; say "воркер завершился, не записав код возврата — см. $job.out" >&2; fi
  exit "$rc"
}

case "${1:-}" in
  --ssh)
    # Строка из forced command недоверенная: разбор без eval и без глобов + белый список.
    set -f
    read -r -a argv <<< "${SSH_ORIGINAL_COMMAND:-}"
    set +f
    set -- "${argv[@]}" ;;
  --worker)
    # Воркер: отдельный процесс со своим set -e (не подоболочка в if, где errexit
    # тихо отключается); код возврата — в файл для транслирующего процесса.
    job="${2:?}"; shift 2
    set +e
    trap - ERR   # ненулевой код дочернего --run — штатный исход, а не «сбой в строке»
    "$SELF" --run "$@"
    rc=$?
    printf '%s\n' "$rc" > "$job.rc"
    exit "$rc" ;;
  --run)
    shift
    validate "$@"
    case "$1" in
      deploy)   cmd_deploy "$2" ;;
      rollback) cmd_rollback "${2:-}" ;;
    esac
    exit 0 ;;
esac

validate "$@"
case "$1" in
  deploy|rollback) run_detached "$@" ;;
  status)          cmd_status ;;
esac
