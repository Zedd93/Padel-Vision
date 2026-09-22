#!/usr/bin/env bash
set -euo pipefail

# ─── PadelVision — weryfikacja konfiguracji YouTube (Faza 0) ─────
#
# Sprawdza, czy klient OAuth i kanał są gotowe do transmisji na żywo:
#   1. refresh token wymienia się na access token
#   2. kanał jest widoczny przez API (channels.list)
#   3. konto ma dostęp do Live API (liveStreams.list)
#
# Użycie:
#   export YOUTUBE_CLIENT_ID='...'
#   export YOUTUBE_CLIENT_SECRET='...'
#   export YOUTUBE_REFRESH_TOKEN='...'
#   ./scripts/youtube-check.sh
#
# Skrypt NIE wypisuje tokenów ani sekretów.
# Dokumentacja: docs/YOUTUBE_SETUP.md
# ──────────────────────────────────────────────────────────────────

red()   { printf "\033[0;31m%s\033[0m\n" "$1"; }
green() { printf "\033[0;32m%s\033[0m\n" "$1"; }
yellow(){ printf "\033[0;33m%s\033[0m\n" "$1"; }
dim()   { printf "\033[2m%s\033[0m\n" "$1"; }

for cmd in curl jq; do
  if ! command -v "$cmd" &>/dev/null; then
    red "Brak wymaganego narzędzia: $cmd"
    echo "macOS: brew install $cmd"
    exit 1
  fi
done

missing=0
for var in YOUTUBE_CLIENT_ID YOUTUBE_CLIENT_SECRET YOUTUBE_REFRESH_TOKEN; do
  if [ -z "${!var:-}" ]; then
    red "Brak zmiennej środowiskowej: $var"
    missing=1
  fi
done
if [ "$missing" -eq 1 ]; then
  echo
  dim "Patrz docs/YOUTUBE_SETUP.md — krok 4 (OAuth Playground)."
  exit 1
fi

# ─── 1. Refresh token → access token ──────────────────────────────
echo "→ Wymiana refresh tokenu na access token…"

token_response="$(curl -sS -X POST https://oauth2.googleapis.com/token \
  -d "client_id=${YOUTUBE_CLIENT_ID}" \
  -d "client_secret=${YOUTUBE_CLIENT_SECRET}" \
  -d "refresh_token=${YOUTUBE_REFRESH_TOKEN}" \
  -d "grant_type=refresh_token")"

if echo "$token_response" | jq -e '.error' >/dev/null 2>&1; then
  err="$(echo "$token_response" | jq -r '.error')"
  desc="$(echo "$token_response" | jq -r '.error_description // "brak opisu"')"
  red "✗ Wymiana tokenu nieudana: ${err}"
  dim "   ${desc}"
  echo
  case "$err" in
    invalid_grant)
      yellow "Najczęstsze przyczyny:"
      echo "  • refresh token wygasł (tryb testowy = ważność 7 dni)"
      echo "  • zgoda została cofnięta na myaccount.google.com → Uprawnienia"
      echo "  • token pochodzi od innego client_id niż podany"
      ;;
    invalid_client)
      yellow "client_id lub client_secret się nie zgadza — sprawdź krok 2d w docs/YOUTUBE_SETUP.md."
      ;;
  esac
  exit 1
fi

ACCESS_TOKEN="$(echo "$token_response" | jq -r '.access_token')"
if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  red "✗ Odpowiedź nie zawiera access_token."
  exit 1
fi
green "✓ Access token uzyskany"

granted_scope="$(echo "$token_response" | jq -r '.scope // ""')"
if [ -n "$granted_scope" ] && [[ "$granted_scope" != *"youtube.force-ssl"* ]]; then
  yellow "⚠ Brak scope youtube.force-ssl. Przyznano: ${granted_scope}"
  echo "  Powtórz krok 4 z poprawnym scope."
fi

api() {
  curl -sS -H "Authorization: Bearer ${ACCESS_TOKEN}" "$1"
}

# ─── 2. Kanał ─────────────────────────────────────────────────────
echo "→ Odpytywanie channels.list…"

channels="$(api "https://www.googleapis.com/youtube/v3/channels?part=snippet,status,contentDetails&mine=true")"

if echo "$channels" | jq -e '.error' >/dev/null 2>&1; then
  reason="$(echo "$channels" | jq -r '.error.errors[0].reason // .error.status // "unknown"')"
  red "✗ channels.list nieudane: ${reason}"
  dim "   $(echo "$channels" | jq -r '.error.message // ""')"
  if [ "$reason" = "accessNotConfigured" ]; then
    echo
    yellow "YouTube Data API v3 nie jest włączone w projekcie — patrz krok 1."
  fi
  exit 1
fi

count="$(echo "$channels" | jq -r '.pageInfo.totalResults // 0')"
if [ "$count" = "0" ]; then
  red "✗ Konto nie ma kanału YouTube."
  echo "  Załóż kanał na youtube.com i powtórz krok 4."
  exit 1
fi

CHANNEL_TITLE="$(echo "$channels" | jq -r '.items[0].snippet.title')"
CHANNEL_ID="$(echo "$channels" | jq -r '.items[0].id')"
green "✓ Kanał: ${CHANNEL_TITLE}"
dim "   Channel ID: ${CHANNEL_ID}"

# ─── 3. Dostęp do Live API ────────────────────────────────────────
echo "→ Odpytywanie liveStreams.list…"

livestreams="$(api "https://www.googleapis.com/youtube/v3/liveStreams?part=id&mine=true&maxResults=1")"

if echo "$livestreams" | jq -e '.error' >/dev/null 2>&1; then
  reason="$(echo "$livestreams" | jq -r '.error.errors[0].reason // .error.status // "unknown"')"
  red "✗ liveStreams: ${reason}"
  dim "   $(echo "$livestreams" | jq -r '.error.message // ""')"
  echo
  case "$reason" in
    liveStreamingNotEnabled|livePermissionBlocked|forbidden|FORBIDDEN)
      yellow "Transmisje na żywo nie są jeszcze aktywne na tym kanale."
      echo "  • youtube.com → Utwórz (ikona kamery) → Rozpocznij transmisję na żywo"
      echo "  • token musi być wydany dla kanału testowego, nie prywatnego (krok 4)"
      echo "    jeśli wyżej widać zły kanał: usuń dostęp PadelVision na"
      echo "    myaccount.google.com/connections i powtórz krok 4"
      echo "  • po włączeniu obowiązuje 24 h karencji"
      echo "  • sprawdź brak ostrzeżeń w YouTube Studio → Ustawienia → Kanał"
      ;;
    quotaExceeded)
      yellow "Wyczerpana dobowa quota projektu (10 000 jednostek). Spróbuj jutro."
      ;;
  esac
  exit 1
fi

green "✓ liveStreams: OK — kanał może transmitować"

existing="$(echo "$livestreams" | jq -r '.pageInfo.totalResults // 0')"
dim "   Istniejące obiekty liveStream na kanale: ${existing}"

echo
green "════════════════════════════════════════════"
green " Faza 0 zweryfikowana — można ruszać z Fazą 1"
green "════════════════════════════════════════════"
echo
dim "Pozostałe kroki z docs/YOUTUBE_SETUP.md:"
dim "  • YOUTUBE_TOKEN_ENC_KEY w menedzerze hasel + backup"
dim "  • redirect URI oauthplayground zostaje do Fazy 3, potem do usunięcia"
