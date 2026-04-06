#!/usr/bin/env bash
set -euo pipefail

# ─── PadelVision — AWS Secrets Manager Helper ─────────────
#
# Użycie:
#   ./scripts/secrets.sh upload dev     — wgraj sekrety dev do AWS SM
#   ./scripts/secrets.sh upload prod    — wgraj sekrety prod do AWS SM
#   ./scripts/secrets.sh download dev   — pobierz sekrety i wygeneruj .env
#   ./scripts/secrets.sh download prod  — pobierz sekrety prod → .env.production
#   ./scripts/secrets.sh list           — pokaż dostępne sekrety w AWS SM
#   ./scripts/secrets.sh edit dev       — otwórz sekrety dev w edytorze
#
# Wymaga: aws CLI zalogowane (aws configure / aws sso login)
# ───────────────────────────────────────────────────────────

REGION="${AWS_REGION:-eu-central-1}"
PREFIX="padelvision"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

red()   { printf "\033[0;31m%s\033[0m\n" "$1"; }
green() { printf "\033[0;32m%s\033[0m\n" "$1"; }
yellow(){ printf "\033[0;33m%s\033[0m\n" "$1"; }

check_aws() {
  if ! command -v aws &>/dev/null; then
    red "AWS CLI nie jest zainstalowane."
    echo "Zainstaluj: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
  fi
  if ! aws sts get-caller-identity &>/dev/null; then
    red "Nie jesteś zalogowany do AWS."
    echo "Uruchom: aws configure   lub   aws sso login"
    exit 1
  fi
  green "✓ AWS CLI OK — $(aws sts get-caller-identity --query 'Account' --output text)"
}

secret_name() {
  echo "${PREFIX}/${1}"
}

# ─── UPLOAD ───────────────────────────────────────────────
cmd_upload() {
  local env="${1:?Podaj środowisko: dev lub prod}"
  local name
  name="$(secret_name "$env")"
  local file="${ROOT_DIR}/scripts/secrets-${env}.json"

  if [[ ! -f "$file" ]]; then
    red "Plik $file nie istnieje."
    echo ""
    echo "Stwórz go kopiując template:"
    echo "  cp scripts/secrets-template.json scripts/secrets-${env}.json"
    echo "  # uzupełnij wartości"
    echo "  ./scripts/secrets.sh upload ${env}"
    exit 1
  fi

  # Sprawdź czy zawiera CHANGE_ME
  if grep -q "CHANGE_ME" "$file"; then
    yellow "⚠ Plik zawiera wartości CHANGE_ME — upewnij się że uzupełniłeś wszystkie sekrety!"
    read -r -p "Kontynuować mimo to? (y/N) " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || exit 0
  fi

  # Sprawdź czy sekret już istnieje
  if aws secretsmanager describe-secret --secret-id "$name" --region "$REGION" &>/dev/null; then
    yellow "Sekret $name już istnieje — aktualizuję..."
    aws secretsmanager put-secret-value \
      --secret-id "$name" \
      --secret-string "file://$file" \
      --region "$REGION"
  else
    echo "Tworzę nowy sekret: $name"
    aws secretsmanager create-secret \
      --name "$name" \
      --description "PadelVision ${env} environment secrets" \
      --secret-string "file://$file" \
      --region "$REGION" \
      --tags "Key=project,Value=padelvision" "Key=env,Value=${env}"
  fi

  green "✓ Sekrety ${env} zapisane w AWS Secrets Manager jako: $name"
  echo ""
  yellow "Teraz możesz bezpiecznie usunąć plik lokalny:"
  echo "  rm scripts/secrets-${env}.json"
}

# ─── DOWNLOAD ─────────────────────────────────────────────
cmd_download() {
  local env="${1:?Podaj środowisko: dev lub prod}"
  local name
  name="$(secret_name "$env")"

  echo "Pobieram sekrety: $name ..."

  local json
  json="$(aws secretsmanager get-secret-value \
    --secret-id "$name" \
    --region "$REGION" \
    --query 'SecretString' \
    --output text)"

  # Określ plik docelowy
  local target
  if [[ "$env" == "prod" ]]; then
    target="${ROOT_DIR}/.env.production"
  else
    target="${ROOT_DIR}/.env"
  fi

  # Konwertuj JSON → .env format
  echo "$json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for k, v in data.items():
    if k.startswith('#'):
        print(f'\n{v}' if v else '')
    else:
        print(f'{k}={v}')
" > "$target"

  green "✓ Sekrety zapisane do: $target"

  # Generuj też pliki per-service
  if [[ "$env" == "dev" ]]; then
    # Frontend .env
    echo "$json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
fe_keys = ['VITE_API_URL', 'VITE_WS_URL', 'VITE_GOOGLE_CLIENT_ID']
for k in fe_keys:
    if k in data:
        print(f'{k}={data[k]}')
" > "${ROOT_DIR}/frontend/.env"
    green "✓ Frontend .env wygenerowany"

    # Backend .env
    echo "$json" | python3 -c "
import json, sys
data = json.load(sys.stdin)
skip = ['VITE_API_URL', 'VITE_WS_URL', 'VITE_GOOGLE_CLIENT_ID', 'DIGITALOCEAN_HOST', 'DIGITALOCEAN_USERNAME', 'GHCR_TOKEN']
for k, v in data.items():
    if not k.startswith('#') and k not in skip:
        print(f'{k}={v}')
" > "${ROOT_DIR}/backend/.env"
    green "✓ Backend .env wygenerowany"
  fi
}

# ─── LIST ─────────────────────────────────────────────────
cmd_list() {
  echo "Sekrety PadelVision w AWS Secrets Manager (region: $REGION):"
  echo ""
  aws secretsmanager list-secrets \
    --region "$REGION" \
    --filters "Key=name,Values=${PREFIX}/" \
    --query 'SecretList[].{Name:Name,Updated:LastChangedDate,Created:CreatedDate}' \
    --output table 2>/dev/null || yellow "Brak sekretów z prefixem ${PREFIX}/"
}

# ─── EDIT ─────────────────────────────────────────────────
cmd_edit() {
  local env="${1:?Podaj środowisko: dev lub prod}"
  local name
  name="$(secret_name "$env")"
  local tmpfile
  tmpfile="$(mktemp /tmp/pv-secrets-XXXXXX.json)"

  echo "Pobieram aktualne sekrety..."
  aws secretsmanager get-secret-value \
    --secret-id "$name" \
    --region "$REGION" \
    --query 'SecretString' \
    --output text | python3 -m json.tool > "$tmpfile"

  local editor="${EDITOR:-nano}"
  "$editor" "$tmpfile"

  read -r -p "Zapisać zmiany do AWS? (y/N) " confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    aws secretsmanager put-secret-value \
      --secret-id "$name" \
      --secret-string "file://$tmpfile" \
      --region "$REGION"
    green "✓ Zaktualizowano sekrety ${env}"
  else
    yellow "Anulowano."
  fi

  rm -f "$tmpfile"
}

# ─── MAIN ─────────────────────────────────────────────────
cmd="${1:-help}"
shift || true

case "$cmd" in
  upload)   check_aws; cmd_upload "$@" ;;
  download) check_aws; cmd_download "$@" ;;
  list)     check_aws; cmd_list ;;
  edit)     check_aws; cmd_edit "$@" ;;
  *)
    echo "PadelVision — Secrets Manager"
    echo ""
    echo "Użycie:"
    echo "  $0 upload <dev|prod>    — wgraj sekrety do AWS"
    echo "  $0 download <dev|prod>  — pobierz sekrety → .env"
    echo "  $0 list                 — lista sekretów w AWS"
    echo "  $0 edit <dev|prod>      — edytuj sekrety w AWS"
    echo ""
    echo "Pierwsza konfiguracja:"
    echo "  1. cp scripts/secrets-template.json scripts/secrets-dev.json"
    echo "  2. Uzupełnij wartości w scripts/secrets-dev.json"
    echo "  3. $0 upload dev"
    echo "  4. rm scripts/secrets-dev.json"
    echo "  5. $0 download dev"
    ;;
esac
