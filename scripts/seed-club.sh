#!/usr/bin/env bash
set -euo pipefail

# ─── PadelVision — konto klubu do testów lokalnych ────────────────
#
# Rejestracja przez API zawsze tworzy użytkownika z rolą VIEWER, a nie ma
# jeszcze endpointu zakładającego klub. Ten skrypt podnosi istniejące konto
# do roli CLUB i dopina do niego rekord klubu, żeby dało się wejść w Studio.
#
# Użycie:
#   1. Zarejestruj się w aplikacji (albo curlem na /api/auth/register)
#   2. ./scripts/seed-club.sh twoj@email.pl ["Nazwa klubu"]
#   3. Zaloguj się ponownie — rola siedzi w tokenie JWT
#
# Tylko do developmentu. Na produkcji klub zakłada się przez panel admina.
# ──────────────────────────────────────────────────────────────────

red()   { printf "\033[0;31m%s\033[0m\n" "$1"; }
green() { printf "\033[0;32m%s\033[0m\n" "$1"; }
dim()   { printf "\033[2m%s\033[0m\n" "$1"; }

EMAIL="${1:-}"
CLUB_NAME="${2:-Klub Testowy}"

if [ -z "$EMAIL" ]; then
  red "Podaj adres e-mail zarejestrowanego użytkownika."
  echo "Użycie: ./scripts/seed-club.sh twoj@email.pl [\"Nazwa klubu\"]"
  exit 1
fi

COMPOSE_SERVICE="${POSTGRES_SERVICE:-postgres}"
DB_NAME="${POSTGRES_DB:-padelvision}"
DB_USER="${POSTGRES_USER:-padelvision}"

if ! docker compose ps --status running --services 2>/dev/null | grep -qx "$COMPOSE_SERVICE"; then
  red "Kontener '$COMPOSE_SERVICE' nie działa."
  echo "Uruchom: docker compose up -d postgres redis backend"
  exit 1
fi

# Slug musi być unikalny i URL-safe
SLUG="$(printf '%s' "$CLUB_NAME" \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/ą/a/g; s/ć/c/g; s/ę/e/g; s/ł/l/g; s/ń/n/g; s/ó/o/g; s/ś/s/g; s/ź/z/g; s/ż/z/g' \
  | sed 's/[^a-z0-9]\+/-/g; s/^-//; s/-$//')"

psql_do() {
  docker compose exec -T "$COMPOSE_SERVICE" psql -v ON_ERROR_STOP=1 -q -U "$DB_USER" -d "$DB_NAME" "$@"
}

echo "→ Szukam użytkownika ${EMAIL}…"
USER_ID="$(psql_do -tAc "SELECT id FROM users WHERE email = '${EMAIL}'")"

if [ -z "$USER_ID" ]; then
  red "✗ Nie ma użytkownika o adresie ${EMAIL}."
  echo "  Zarejestruj się najpierw w aplikacji albo przez /api/auth/register."
  exit 1
fi
green "✓ Użytkownik: ${USER_ID}"

echo "→ Podnoszę rolę do CLUB…"
psql_do -c "UPDATE users SET role = 'CLUB' WHERE id = '${USER_ID}'"

EXISTING_CLUB="$(psql_do -tAc "SELECT id FROM clubs WHERE user_id = '${USER_ID}'")"

if [ -n "$EXISTING_CLUB" ]; then
  green "✓ Klub już istnieje: ${EXISTING_CLUB}"
else
  echo "→ Tworzę klub „${CLUB_NAME}”…"
  CLUB_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
  STREAM_KEY="$(uuidgen | tr '[:upper:]' '[:lower:]')"

  psql_do -c "INSERT INTO clubs (id, user_id, name, slug, city, stream_key, court_count, plan, is_verified)
              VALUES ('${CLUB_ID}', '${USER_ID}', '${CLUB_NAME}', '${SLUG}', 'Katowice', '${STREAM_KEY}', 2, 'PRO', TRUE)"
  green "✓ Klub utworzony: ${CLUB_ID}"
fi

echo
green "════════════════════════════════════════════"
green " Konto klubu gotowe"
green "════════════════════════════════════════════"
echo
dim "Dalej:"
dim "  1. Wyloguj się i zaloguj ponownie — rola jest zapisana w tokenie JWT"
dim "  2. Wejdź na /studio i połącz kanał YouTube"
dim "  3. Pełny scenariusz testu: docs/YOUTUBE_TEST.md"
