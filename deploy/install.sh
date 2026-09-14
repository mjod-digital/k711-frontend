#!/usr/bin/env bash
# Подготовка прод-сервера к выкладке через deploy.sh. Идемпотентен: повторный
# запуск обновляет установленный deploy.sh и перепроверяет настройки.
#
# Запуск на сервере под пользователем приложения (не root):
#   bash install.sh [--ci-pubkey-file ПУТЬ]
#
# Что делает:
#   1. ставит deploy.sh в ~/k711-deploy/bin/;
#   2. создаёт read-only ключ сервер→GitHub (публичную часть добавить в репозиторий:
#      Settings → Deploy keys, БЕЗ write access);
#   3. получает host key github.com, сверяет с официальным отпечатком и кладёт ТОЛЬКО
#      его в отдельный known_hosts, которым пользуется deploy.sh;
#   4. заводит bare-репозиторий для shallow-fetch;
#   5. один раз переводит боевой каталог ~/app-new в релиз и ставит на его место
#      симлинк (без рестарта) и заносит этот релиз в историю живых;
#   6. проверяет, что pm2 запускает приложение из ~/app-new;
#   7. (опционально) добавляет ключ CI в authorized_keys с forced command. Сам ключ
#      shell не даёт, НО выкладывает код из main, а выкладываемый код исполняется
#      на сервере — см. DEPLOY.md, «Модель доверия».

set -Eeuo pipefail
umask 022

ROOT="$HOME/k711-deploy"
APP_LINK="$HOME/app-new"
GITHUB_KEY="$HOME/.ssh/k711_github_deploy"
GITHUB_KNOWN_HOSTS="$ROOT/github_known_hosts"
REPO_URL="git@github.com:mjod-digital/k711-frontend.git"
GITHUB_ED25519_FP="SHA256:+DiY3wvvV6TuJJhbpZisF/zLDA0zPMSvHdkr4UvCOqU"   # api.github.com/meta
PM2_APP="k711"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

say() { printf '[install] %s\n' "$*"; }
die() { printf '[install] ОШИБКА: %s\n' "$*" >&2; exit 1; }
trap 'die "сбой в строке $LINENO"' ERR

CI_PUBKEY_FILE=""
while (( $# )); do
  case "$1" in
    --ci-pubkey-file) CI_PUBKEY_FILE="${2:?путь к публичному ключу}"; shift 2 ;;
    *) die "неизвестный аргумент: $1" ;;
  esac
done

[[ "$(id -u)" -ne 0 ]] || die "запускайте под пользователем приложения, не под root"
[[ -f "$SRC_DIR/deploy.sh" ]] || die "рядом с install.sh должен лежать deploy.sh"
command -v flock >/dev/null || die "нужен flock (util-linux)"

# 1. deploy.sh
mkdir -p "$ROOT/bin" "$ROOT/releases" "$ROOT/logs"
install -m 0755 "$SRC_DIR/deploy.sh" "$ROOT/bin/deploy.sh"
say "deploy.sh установлен: $ROOT/bin/deploy.sh"

# 2. ключ сервер→GitHub
mkdir -p "$HOME/.ssh" && chmod 700 "$HOME/.ssh"
if [[ ! -f "$GITHUB_KEY" ]]; then
  ssh-keygen -q -t ed25519 -N '' -C "k711-prod-readonly@$(hostname)" -f "$GITHUB_KEY"
  say "создан ключ для GitHub: $GITHUB_KEY"
fi

# 3. host key github.com — всегда заново, в отдельный файл, только после сверки
scanned="$(ssh-keyscan -t ed25519 github.com 2>/dev/null || true)"
[[ -n "$scanned" ]] || die "не удалось получить host key github.com (сеть?)"
fp="$(ssh-keygen -lf - <<< "$scanned" | awk '{print $2}')"
[[ "$fp" == "$GITHUB_ED25519_FP" ]] || die "host key github.com ($fp) не совпал с официальным $GITHUB_ED25519_FP"
printf '%s\n' "$scanned" > "$GITHUB_KNOWN_HOSTS.tmp" && mv -f "$GITHUB_KNOWN_HOSTS.tmp" "$GITHUB_KNOWN_HOSTS"
say "host key github.com сверен с официальным и закреплён в $GITHUB_KNOWN_HOSTS"

# 4. bare-репозиторий
if [[ ! -d "$ROOT/repo.git" ]]; then
  git init --bare --quiet "$ROOT/repo.git"
  git -C "$ROOT/repo.git" remote add origin "$REPO_URL"
  say "создан $ROOT/repo.git"
fi

# 5. ~/app-new: каталог → релиз + симлинк. Два rename() подряд: работающий процесс
#    продолжает обслуживать запросы, рестарт не нужен.
if [[ -d "$APP_LINK" && ! -L "$APP_LINK" ]]; then
  [[ -s "$APP_LINK/.next/BUILD_ID" ]] || die "$APP_LINK не похож на собранное приложение — прерываю"
  legacy="$(date +%Y%m%d-%H%M%S)-legacy"
  rm -f -- "$APP_LINK.next"
  ln -sn "$ROOT/releases/$legacy" "$APP_LINK.next"
  mv -- "$APP_LINK" "$ROOT/releases/$legacy"
  mv -T -- "$APP_LINK.next" "$APP_LINK"
  printf 'legacy — ручная выкладка до перехода на deploy.sh\n' > "$ROOT/releases/$legacy/REVISION"
  say "боевой каталог стал релизом $legacy, $APP_LINK теперь симлинк"
elif [[ -L "$APP_LINK" ]]; then
  say "$APP_LINK уже симлинк → $(readlink -f "$APP_LINK")"
else
  die "$APP_LINK не найден"
fi
current="$(basename "$(readlink -f "$APP_LINK")")"
if ! { [[ -f "$ROOT/live.log" ]] && awk -F'\t' -v id="$current" '$2 == id {f=1} END {exit !f}' "$ROOT/live.log"; }; then
  printf '%s\t%s\n' "$(date -Is)" "$current" >> "$ROOT/live.log"
  say "релиз $current занесён в историю живых (на него можно откатиться)"
fi

# 6. pm2 должен запускать приложение из симлинка, иначе переключение ни на что не повлияет
node_bin="$(for d in "$HOME"/.nvm/versions/node/v22.*/bin; do if [[ -x "$d/node" ]]; then echo "$d"; fi; done | sort -V | tail -n 1)"
if [[ -n "$node_bin" ]]; then
  pm2_cwd="$(PM2_HOME="$HOME/.pm2-node22" PATH="$node_bin:$PATH" pm2 jlist 2>/dev/null \
    | PATH="$node_bin:$PATH" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const p=JSON.parse(s.slice(s.indexOf("["))).find(x=>x.name===process.argv[1]);process.stdout.write(p?String(p.pm2_env.pm_cwd):"")}catch{}})' "$PM2_APP" || true)"
  if [[ "$pm2_cwd" == "$APP_LINK" ]]; then say "pm2: $PM2_APP запускается из $APP_LINK — ок"
  else say "ВНИМАНИЕ: pm2 запускает $PM2_APP из «${pm2_cwd:-?}», а должен из $APP_LINK — deploy.sh откажется работать (см. DEPLOY.md)"; fi
fi

# 7. ключ CI с forced command — только точной строкой
if [[ -n "$CI_PUBKEY_FILE" ]]; then
  ktype="" kbody=""
  read -r ktype kbody _ < "$CI_PUBKEY_FILE" || [[ -n "$kbody" ]] || die "не удалось прочитать $CI_PUBKEY_FILE"
  [[ "$ktype" =~ ^ssh-(ed25519|rsa)$ && "$kbody" =~ ^[A-Za-z0-9+/=]+$ ]] || die "$CI_PUBKEY_FILE — не публичный SSH-ключ"
  AUTH="$HOME/.ssh/authorized_keys"
  touch "$AUTH" && chmod 600 "$AUTH"
  expected="restrict,command=\"$ROOT/bin/deploy.sh --ssh\" $ktype $kbody k711-github-actions-deploy"
  if grep -qxF -- "$expected" "$AUTH"; then
    say "ключ CI уже установлен с ограничением"
  elif grep -qF -- "$kbody" "$AUTH"; then
    die "этот ключ уже есть в authorized_keys БЕЗ нужного ограничения — sshd использует первую совпавшую строку. Уберите старую строку или используйте отдельный ключ для CI"
  else
    printf '%s\n' "$expected" >> "$AUTH"
    say "ключ CI добавлен: им можно только вызывать deploy.sh, shell он не даёт"
  fi
fi

cat <<TXT

Готово. Осталось в GitHub (Settings репозитория k711-frontend):
  • Deploy keys → Add deploy key, «Allow write access» НЕ отмечать:
$(sed 's/^/      /' "$GITHUB_KEY.pub")
Проверка доступа с сервера:
  ssh -i $GITHUB_KEY -o IdentitiesOnly=yes -o UserKnownHostsFile=$GITHUB_KNOWN_HOSTS -T git@github.com
Состояние:
  $ROOT/bin/deploy.sh status
TXT
