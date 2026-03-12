#!/usr/bin/env bash
# ============================================================
# Script de migración para base de datos ya en uso
#
# Aplica las migraciones SQL pendientes en orden, de la más
# antigua a la más nueva. Es seguro ejecutarlo múltiples veces
# (cada migración es idempotente).
#
# Uso:
#   ./scripts/migrate.sh                          → lee DATABASE_URL del .env raíz
#   DATABASE_URL=postgres://... ./scripts/migrate.sh  → URL explícita
#   ./scripts/migrate.sh --dry-run                → solo muestra el SQL, no ejecuta
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
DRY_RUN=false

# Parsear flags
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
  esac
done

# ── Resolver DATABASE_URL ────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ]; then
  ENV_FILE="${ROOT_DIR}/.env"
  if [ -f "$ENV_FILE" ]; then
    DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
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

# ── Lista de migraciones en orden cronológico ────────────────
# Cada entrada: "archivo.sql | descripción"
# Las migraciones se aplican de arriba hacia abajo.
# ─────────────────────────────────────────────────────────────
MIGRATIONS=(
  "migrate-expense-items.sql|Refactorización ítems presupuestarios en gastos (stage_id + expense_items)"
)
# Nota: migrate-add-expense-budget-item.sql quedó obsoleto y fue
# reemplazado por migrate-expense-items.sql, que incluye la migración
# de datos y la eliminación de las columnas anteriores.

# ── Función para ejecutar un archivo SQL ─────────────────────
run_sql() {
  local sql_file="$1"
  if command -v psql &>/dev/null; then
    psql "$DATABASE_URL" -f "$sql_file" -v ON_ERROR_STOP=1
  elif command -v npx &>/dev/null; then
    cd "$ROOT_DIR"
    npx prisma db execute --file "$sql_file" --schema packages/database/prisma/schema.prisma
  else
    echo "❌  No se encontró psql ni npx. Instalá PostgreSQL client o Node.js."
    exit 1
  fi
}

# ── Ejecutar migraciones ──────────────────────────────────────
echo "════════════════════════════════════════════════════"
echo "  Migraciones de base de datos"
echo "  Total: ${#MIGRATIONS[@]} migración(es)"
echo "════════════════════════════════════════════════════"
echo ""

for entry in "${MIGRATIONS[@]}"; do
  filename="${entry%%|*}"
  description="${entry##*|}"
  sql_file="${SCRIPT_DIR}/${filename}"

  echo "▶  ${description}"
  echo "   Archivo: ${filename}"

  if [ ! -f "$sql_file" ]; then
    echo "   ⚠️  Archivo no encontrado, omitiendo."
    echo ""
    continue
  fi

  if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "   🔍 DRY RUN — SQL que se ejecutaría:"
    echo "   ────────────────────────────────────"
    cat "$sql_file"
    echo "   ────────────────────────────────────"
    echo "   (no se realizaron cambios)"
  else
    run_sql "$sql_file"
    echo "   ✅  Aplicada"
  fi

  echo ""
done

if [ "$DRY_RUN" = false ]; then
  echo "════════════════════════════════════════════════════"
  echo "  ✅  Todas las migraciones aplicadas correctamente"
  echo "════════════════════════════════════════════════════"
  echo ""
  echo "Próximos pasos:"
  echo "  1. Regenerar Prisma Client:  pnpm db:generate"
  echo "  2. Reiniciar API:            pnpm dev:api"
  echo "     o en Docker:              docker compose restart api"
fi
