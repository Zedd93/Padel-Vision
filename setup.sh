#!/usr/bin/env bash
set -euo pipefail

# ─── PadelVision — Project Setup ──────────────────────────
#
# Użycie:
#   ./setup.sh          — pełny setup (backend + frontend)
#   ./setup.sh backend  — tylko backend
#   ./setup.sh frontend — tylko frontend
#   ./setup.sh docker   — setup + budowanie kontenerów
#
# ──────────────────────────────────────────────────────────

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

red()   { printf "\033[0;31m%s\033[0m\n" "$1"; }
green() { printf "\033[0;32m%s\033[0m\n" "$1"; }
yellow(){ printf "\033[0;33m%s\033[0m\n" "$1"; }
blue()  { printf "\033[0;34m%s\033[0m\n" "$1"; }

header() {
  echo ""
  blue "━━━ $1 ━━━"
}

# ─── Prerequisites Check ─────────────────────────────────
check_prerequisites() {
  header "Sprawdzanie wymagań"
  local missing=0

  if command -v git &>/dev/null; then
    green "✓ Git $(git --version | cut -d' ' -f3)"
  else
    red "✗ Git — wymagany"; missing=1
  fi

  if command -v docker &>/dev/null; then
    green "✓ Docker $(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)"
  else
    red "✗ Docker — wymagany do uruchomienia kontenerów"; missing=1
  fi

  if command -v docker compose &>/dev/null || docker compose version &>/dev/null 2>&1; then
    green "✓ Docker Compose"
  else
    red "✗ Docker Compose — wymagany"; missing=1
  fi

  if command -v java &>/dev/null; then
    green "✓ Java $(java -version 2>&1 | head -1 | cut -d'"' -f2)"
  else
    red "✗ Java 21+ — wymagany dla backendu"; missing=1
  fi

  if command -v mvn &>/dev/null; then
    green "✓ Maven $(mvn --version 2>/dev/null | head -1 | grep -oP '\d+\.\d+\.\d+' || echo '?')"
  else
    red "✗ Maven — wymagany do wygenerowania wrappera"
    echo "  Zainstaluj: brew install maven / sudo apt install maven / sdkman install maven"
    missing=1
  fi

  if command -v node &>/dev/null; then
    green "✓ Node.js $(node --version)"
  else
    red "✗ Node.js 20+ — wymagany dla frontendu"; missing=1
  fi

  if command -v npm &>/dev/null; then
    green "✓ npm $(npm --version)"
  else
    red "✗ npm — wymagany dla frontendu"; missing=1
  fi

  if [[ $missing -ne 0 ]]; then
    echo ""
    red "Brakuje wymaganych narzędzi. Zainstaluj je i spróbuj ponownie."
    exit 1
  fi
}

# ─── Environment Files ───────────────────────────────────
setup_env_files() {
  header "Konfiguracja .env"

  if [[ ! -f "$ROOT_DIR/backend/.env" ]]; then
    cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
    green "✓ Utworzono backend/.env z szablonu"
    yellow "  → Uzupełnij wartości w backend/.env przed uruchomieniem"
  else
    green "✓ backend/.env już istnieje"
  fi

  if [[ ! -f "$ROOT_DIR/frontend/.env" ]]; then
    cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env"
    green "✓ Utworzono frontend/.env z szablonu"
  else
    green "✓ frontend/.env już istnieje"
  fi
}

# ─── Backend Setup ────────────────────────────────────────
setup_backend() {
  header "Backend Setup"

  cd "$ROOT_DIR/backend"

  # Maven Wrapper — wymagany przez Dockerfile
  if [[ ! -f "mvnw" ]]; then
    echo "Generowanie Maven Wrapper..."
    mvn wrapper:wrapper -q
    chmod +x mvnw
    green "✓ Maven Wrapper wygenerowany (mvnw + .mvn/)"
  else
    green "✓ Maven Wrapper już istnieje"
  fi

  # Weryfikacja wrappera
  if ./mvnw --version &>/dev/null; then
    green "✓ Maven Wrapper działa"
  else
    red "✗ Maven Wrapper nie działa — sprawdź instalację Javy"
    exit 1
  fi

  # Pobierz zależności
  echo "Pobieranie zależności Maven (offline cache)..."
  ./mvnw dependency:go-offline -B -q 2>/dev/null || true
  green "✓ Zależności Maven pobrane"

  cd "$ROOT_DIR"
}

# ─── Frontend Setup ───────────────────────────────────────
setup_frontend() {
  header "Frontend Setup"

  cd "$ROOT_DIR/frontend"

  echo "Instalowanie zależności npm..."
  npm ci --silent 2>/dev/null || npm install --silent
  green "✓ Zależności npm zainstalowane"

  # Weryfikacja buildu
  echo "Sprawdzanie buildu..."
  npm run build --silent 2>/dev/null && green "✓ Frontend builduje się poprawnie" || yellow "⚠ Build frontendu nie przeszedł — sprawdź błędy"

  cd "$ROOT_DIR"
}

# ─── Docker Build ─────────────────────────────────────────
setup_docker() {
  header "Docker Build"

  echo "Budowanie obrazów Docker..."
  docker compose -f docker-compose.microservices.yml build
  green "✓ Obrazy Docker zbudowane"

  echo ""
  yellow "Uruchom kontenery:"
  echo "  docker compose -f docker-compose.microservices.yml up -d"
}

# ─── Summary ──────────────────────────────────────────────
print_summary() {
  header "Setup zakończony"
  echo ""
  echo "  Backend:   http://localhost:8080"
  echo "  Frontend:  http://localhost:80"
  echo "  Postgres:  localhost:5432"
  echo "  Redis:     localhost:6379"
  echo ""
  echo "  Uruchomienie:  docker compose -f docker-compose.microservices.yml up -d"
  echo "  Testy:         docker compose -f docker-compose.microservices.yml -f docker-compose.test.yml up -d --build"
  echo "  Logi:          docker compose -f docker-compose.microservices.yml logs -f"
  echo ""
}

# ─── Main ─────────────────────────────────────────────────
cmd="${1:-all}"

case "$cmd" in
  backend)
    check_prerequisites
    setup_env_files
    setup_backend
    print_summary
    ;;
  frontend)
    check_prerequisites
    setup_env_files
    setup_frontend
    print_summary
    ;;
  docker)
    check_prerequisites
    setup_env_files
    setup_backend
    setup_frontend
    setup_docker
    print_summary
    ;;
  all|*)
    check_prerequisites
    setup_env_files
    setup_backend
    setup_frontend
    print_summary
    ;;
esac
