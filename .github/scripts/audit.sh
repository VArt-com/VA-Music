#!/usr/bin/env bash
# Простой аудит безопасности и юридических элементов. Без внешних зависимостей.
# ::error  = критично (билд красный), ::warning = нужно исправить, но не блокирует.
cd "$(git rev-parse --show-toplevel)" || exit 1
LOG=$(mktemp)
err()  { echo "::error::$1"   | tee -a "$LOG"; }
warn() { echo "::warning::$1" | tee -a "$LOG"; }

SRC=('*.html' '*.js' '*.ts' '*.tsx' '*.jsx' '*.mjs')
EXCL=(':!package-lock.json' ':!.github' ':!*.b64')

# 1. env-файлы не должны лежать в репозитории
for p in $(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -vE '\.example$'); do
  err "В репозитории закоммичен env-файл: $p (удалить: git rm --cached $p)"
done

# 2. Явные секреты
git grep -nIE 'sk-ant-[A-Za-z0-9_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}' -- . "${EXCL[@]}" \
  | cut -d: -f1,2 | while read -r l; do err "Похоже на секретный ключ: $l"; done
git grep -nIE 'service_role' -- . "${EXCL[@]}" ':!*.md' \
  | cut -d: -f1,2 | while read -r l; do warn "Упоминание service_role (должен быть только на сервере): $l"; done

# 3. JWT с ролью service_role (полный доступ к базе)
git grep -hIoE 'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}' -- . "${EXCL[@]}" | sort -u | python3 -c '
import sys, base64, json
for l in sys.stdin:
    try:
        p = l.strip().split(".")[1]; p += "=" * (-len(p) % 4)
        if json.loads(base64.urlsafe_b64decode(p)).get("role") == "service_role": print("service_role")
    except Exception:
        pass
' | grep -q service_role && err "В коде найден JWT-ключ с ролью service_role — срочно заменить ключ в Supabase!"

# 4. Пароль/хеш в коде с комментарием рядом (частая причина утечки пароля)
git grep -nIE "(HASH|hash)[A-Za-z_]* *= *['\"][0-9a-f]{64}['\"] *;? *//" -- "${SRC[@]}" \
  | cut -d: -f1,2 | while read -r l; do warn "Рядом с хешем пароля есть комментарий — не пароль ли это? $l"; done

# 5. Админка, проверяемая только в браузере
git grep -nIE "sessionStorage\.setItem\(['\"][a-z_]*admin" -- "${SRC[@]}" \
  | cut -d: -f1,2 | while read -r l; do warn "Админ-доступ проверяется только в браузере (обходится из консоли). Защита должна быть на сервере/в RLS: $l"; done

# 6. Опасные конструкции
git grep -nIE '(^|[^A-Za-z_.])eval\(|new Function\(|document\.write\(' -- "${SRC[@]}" "${EXCL[@]}" \
  | cut -d: -f1,2 | while read -r l; do warn "eval/new Function/document.write: $l"; done

# 7. Открытый редирект (Next.js auth callback)
git grep -nIE '\$\{origin\}\$\{next\}' -- "${SRC[@]}" \
  | cut -d: -f1,2 | while read -r l; do err "Открытый редирект через параметр next (проверять, что next начинается с одного '/'): $l"; done

# 8. Внешние скрипты без integrity (SRI)
git grep -nIE '<script[^>]+src="https://' -- '*.html' | grep -v 'integrity=' | grep -vE 'googlesyndication|googletagmanager' \
  | cut -d: -f1,2 | while read -r l; do warn "Внешний скрипт без integrity (SRI): $l"; done

# 9. Юридические элементы (Израиль)
if git ls-files | grep -qE '\.html$'; then
  [ -f privacy.html ] || warn "Нет privacy.html (политика конфиденциальности)"
  [ -f terms.html ]   || warn "Нет terms.html (условия использования / תנאי שימוש)"
  git grep -qiE 'נגישות|accessibility' -- '*.html' || warn "Нет заявления о доступности сайта (הצהרת נגישות) — главный источник исков в Израиле"
  for p in $(git grep -lI 'adsbygoogle' -- '*.html'); do
    grep -qiE 'privacy' "$p" || warn "$p: реклама AdSense есть, а ссылки на политику конфиденциальности нет"
  done
fi
if [ -f package.json ] && grep -q '"next"' package.json; then
  ls -d src/app/privacy app/privacy >/dev/null 2>&1 || warn "В приложении нет страницы /privacy (политика конфиденциальности)"
  ls -d src/app/terms app/terms     >/dev/null 2>&1 || warn "В приложении нет страницы /terms (условия использования)"
fi

E=$(grep -c '^::error' "$LOG"); W=$(grep -c '^::warning' "$LOG")
{
  echo "## Результат аудита"
  echo "Ошибок: **$E**, предупреждений: **$W**"
  [ -s "$LOG" ] && sed -E 's/^::(error|warning)::/- \1: /' "$LOG"
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
echo "Ошибок: $E, предупреждений: $W"
[ "$E" -eq 0 ]
