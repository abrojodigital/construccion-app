#!/usr/bin/env bash
# ============================================================
# Script de migración para base de datos ya en uso
# Uso:
#   ./scripts/migrate.sh                 → lee DATABASE_URL del .env raíz
#   DATABASE_URL=postgres://... ./scripts/migrate.sh   → URL explícita
#   ./scripts/migrate.sh --dry-run       → solo muestra el SQL, no ejecuta
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SQL_FILE="${SCRIPT_DIR}/migrate-add-expense-budget-item.sql"
DRY_RUN=false

# Parsear flags
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
  esac
done

# ── Resolver DATABASE_URL ────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ]; then
  # Intentar cargar desde .env en la raíz
  ENV_FILE="${ROOT_DIR}/.env"
  if [ -f "$ENV_FILE" ]; then
    DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  # Intentar desde apps/api/.env
  API_ENV="${ROOT_DIR}/apps/api/.env"
  if [ -f "$API_ENV" ]; then
    DATABASE_URL=$(grep -E '^DATABASE_URL=' "$API_ENV" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌  No se encontró DATABASE_URL."
  echo "    Definila como variable de entorno o en .env / apps/api/.env"
  exit 1
fi

echo "────────────────────────────────────────────────────"
echo "  Migración: Imputación de gastos a ítems de presupuesto"
echo "────────────────────────────────────────────────────"
echo "  SQL: ${SQL_FILE}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "🔍  DRY RUN — SQL que se ejecutaría:"
  echo ""
  cat "$SQL_FILE"
  echo ""
  echo "  (no se realizaron cambios)"
  exit 0
fi

# ── Ejecutar según driver disponible ────────────────────────
if command -v psql &>/dev/null; then
  echo "⚙️   Ejecutando con psql..."
  psql "$DATABASE_URL" -f "$SQL_FILE" -v ON_ERROR_STOP=1
elif command -v npx &>/dev/null; then
  echo "⚙️   psql no encontrado — usando prisma db execute..."
  cd "$ROOT_DIR"
  npx prisma db execute --file "$SQL_FILE" --schema packages/database/prisma/schema.prisma
else
  echo "❌  No se encontró psql ni npx. Instalá PostgreSQL client o Node.js."
  exit 1
fi

echo ""
echo "✅  Migración aplicada correctamente."
echo ""
echo "Próximos pasos:"
echo "  1. Regenerar Prisma Client:  pnpm db:generate"
echo "  2. Reiniciar API:            pnpm dev:api"
