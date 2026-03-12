#!/usr/bin/env bash
# =============================================================================
# db-sync.sh — Sincroniza el esquema Prisma con PostgreSQL (vía Docker)
#
# Uso:
#   ./scripts/db-sync.sh              # Sincroniza esquema + seed si está vacía
#   ./scripts/db-sync.sh --no-seed    # Solo sincroniza esquema (no toca datos)
#   ./scripts/db-sync.sh --force-seed # Sincroniza + re-seed (borra datos existentes)
#   ./scripts/db-sync.sh --dry-run    # Muestra qué haría, sin ejecutar nada
#
# Casos de uso:
#   - Primera vez en una máquina nueva con Docker instalado
#   - Luego de hacer git pull con cambios en el schema.prisma
#   - Para restablecer datos de demo
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Colores
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()     { echo -e "${GREEN}✔${NC}  $*"; }
info()    { echo -e "${BLUE}ℹ${NC}  $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✖${NC}  $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}▶ $*${NC}"; }
dryrun()  { echo -e "${YELLOW}[DRY-RUN]${NC}  $*"; }

# ---------------------------------------------------------------------------
# Parsear flags
# ---------------------------------------------------------------------------
SEED_MODE="auto"   # auto | skip | force
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --no-seed)    SEED_MODE="skip" ;;
    --force-seed) SEED_MODE="force" ;;
    --dry-run)    DRY_RUN=true ;;
    --help|-h)
      echo ""
      echo -e "${BOLD}db-sync.sh${NC} — Sincronización de esquema y datos"
      echo ""
      echo "  Uso: ./scripts/db-sync.sh [opciones]"
      echo ""
      echo "  Opciones:"
      printf "    %-20s %s\n" "--no-seed"    "Solo sincroniza el esquema, no toca datos"
      printf "    %-20s %s\n" "--force-seed" "Sincroniza + re-seed completo (borra datos)"
      printf "    %-20s %s\n" "--dry-run"    "Muestra qué haría sin ejecutar nada"
      printf "    %-20s %s\n" "--help"       "Muestra esta ayuda"
      echo ""
      echo "  Ejemplos:"
      echo "    ./scripts/db-sync.sh               # Primera vez en máquina nueva"
      echo "    ./scripts/db-sync.sh --no-seed     # Solo actualizar esquema"
      echo "    ./scripts/db-sync.sh --force-seed  # Reset de datos de demo"
      echo ""
      exit 0
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Config desde .env
# ---------------------------------------------------------------------------
if [[ -f "$ROOT_DIR/.env" ]]; then
  while IFS='=' read -r key val; do
    [[ "$key" =~ ^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)$ ]] && export "$key=$val"
  done < <(grep -E '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=' "$ROOT_DIR/.env" 2>/dev/null || true)
fi

DB_CONTAINER="${DB_CONTAINER:-construccion-db}"
API_CONTAINER="${API_CONTAINER:-construccion-api}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASS="${POSTGRES_PASSWORD:-postgres123}"
DB_NAME="${POSTGRES_DB:-construccion_db}"

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                  ║${NC}"
echo -e "${BLUE}║   ${BOLD}Sincronización de Base de Datos${NC}${BLUE}                ║${NC}"
echo -e "${BLUE}║   ${CYAN}Sistema de Gestión de Construcción${NC}${BLUE}             ║${NC}"
echo -e "${BLUE}║                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

if [[ "$DRY_RUN" = true ]]; then
  warn "Modo DRY-RUN activo — no se realizarán cambios reales"
  echo ""
fi

# ---------------------------------------------------------------------------
# Paso 1: Verificar Docker
# ---------------------------------------------------------------------------
step "Verificando Docker"

if ! command -v docker &>/dev/null; then
  error "Docker no está instalado. Instalalo desde https://www.docker.com/products/docker-desktop"
fi

if ! docker info &>/dev/null 2>&1; then
  error "Docker no está corriendo. Iniciá Docker Desktop y volvé a ejecutar este script."
fi

log "Docker está corriendo ($(docker --version | head -1 | cut -d' ' -f3 | tr -d ','))"

# Detectar comando compose
if docker compose version &>/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose"
else
  error "Docker Compose no está disponible."
fi

# ---------------------------------------------------------------------------
# Paso 2: Levantar / verificar contenedor PostgreSQL
# ---------------------------------------------------------------------------
step "Verificando contenedor PostgreSQL ($DB_CONTAINER)"

DB_RUNNING=$(docker ps --filter "name=^${DB_CONTAINER}$" --filter "status=running" -q 2>/dev/null || true)

if [[ -z "$DB_RUNNING" ]]; then
  warn "El contenedor '$DB_CONTAINER' no está corriendo."

  # Verificar si existe pero está detenido
  DB_EXISTS=$(docker ps -a --filter "name=^${DB_CONTAINER}$" -q 2>/dev/null || true)

  if [[ -n "$DB_EXISTS" ]]; then
    info "Encontré el contenedor detenido. Iniciándolo..."
    if [[ "$DRY_RUN" = false ]]; then
      cd "$ROOT_DIR"
      $COMPOSE_CMD start postgres 2>/dev/null || $COMPOSE_CMD up -d postgres
    else
      dryrun "$COMPOSE_CMD start postgres"
    fi
  else
    info "Contenedor no existe. Levantando servicio postgres..."
    if [[ "$DRY_RUN" = false ]]; then
      cd "$ROOT_DIR"
      $COMPOSE_CMD up -d postgres
    else
      dryrun "$COMPOSE_CMD up -d postgres"
    fi
  fi

  if [[ "$DRY_RUN" = false ]]; then
    # Esperar a que PostgreSQL esté listo
    echo ""
    info "Esperando a que PostgreSQL esté listo..."
    MAX_RETRIES=30
    RETRY=0
    until docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" &>/dev/null; do
      RETRY=$((RETRY + 1))
      if [[ $RETRY -ge $MAX_RETRIES ]]; then
        error "PostgreSQL no respondió luego de $MAX_RETRIES intentos."
      fi
      printf "\r  Intento %d/%d..." "$RETRY" "$MAX_RETRIES"
      sleep 2
    done
    echo ""
    log "PostgreSQL listo"
  fi
else
  log "Contenedor '$DB_CONTAINER' corriendo"

  # Verificar que acepta conexiones
  if [[ "$DRY_RUN" = false ]]; then
    if ! docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" &>/dev/null; then
      warn "PostgreSQL está iniciando, esperando..."
      sleep 3
      docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" &>/dev/null \
        || error "PostgreSQL no responde. Revisá: docker logs $DB_CONTAINER"
    fi
    log "PostgreSQL acepta conexiones"
  fi
fi

# ---------------------------------------------------------------------------
# Paso 3: Sincronizar esquema con prisma db push
# ---------------------------------------------------------------------------
step "Sincronizando esquema Prisma"

info "Schema: packages/database/prisma/schema.prisma"
info "Base de datos: $DB_NAME @ $DB_CONTAINER"
echo ""

if [[ "$DRY_RUN" = true ]]; then
  dryrun "prisma db push --skip-generate (ejecutado dentro del contenedor API o vía npx local)"
else
  # Estrategia 1: usar el contenedor API si ya está corriendo (tiene prisma instalado)
  API_RUNNING=$(docker ps --filter "name=^${API_CONTAINER}$" --filter "status=running" -q 2>/dev/null || true)

  if [[ -n "$API_RUNNING" ]]; then
    info "Usando contenedor API existente para ejecutar prisma db push..."
    docker exec "$API_CONTAINER" sh -c "cd /app/packages/database && npx prisma db push --skip-generate --accept-data-loss"

  # Estrategia 2: ejecutar con docker compose run (imagen ya construida)
  elif docker images --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | grep -q "construccion"; then
    info "Ejecutando prisma db push vía docker compose run..."
    cd "$ROOT_DIR"
    $COMPOSE_CMD run --rm --no-deps \
      -e DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@postgres:5432/${DB_NAME}" \
      api sh -c "cd /app/packages/database && npx prisma db push --skip-generate --accept-data-loss"

  # Estrategia 3: ejecutar localmente con pnpm/npx (si hay Node instalado)
  elif command -v npx &>/dev/null; then
    # Construir DATABASE_URL apuntando al Docker local
    LOCAL_DB_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

    # Verificar que el puerto 5432 esté accesible
    if ! docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" &>/dev/null; then
      error "No se puede conectar a PostgreSQL."
    fi

    info "Ejecutando prisma db push localmente (apunta a Docker en localhost:5432)..."
    cd "$ROOT_DIR/packages/database"
    DATABASE_URL="$LOCAL_DB_URL" npx prisma db push --skip-generate --accept-data-loss

  else
    error "No se encontró forma de ejecutar Prisma. Necesitás: contenedor API corriendo, imagen Docker construida, o Node.js instalado."
  fi
fi

log "Esquema sincronizado correctamente"

# ---------------------------------------------------------------------------
# Paso 4: Verificar si la base tiene datos
# ---------------------------------------------------------------------------
step "Verificando datos existentes"

if [[ "$DRY_RUN" = true ]]; then
  dryrun "SELECT count(*) FROM \"Organization\"  (consulta de verificación)"
  SEED_NEEDED=true
else
  ORG_COUNT=$(docker exec -e PGPASSWORD="$DB_PASS" "$DB_CONTAINER" \
    psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    'SELECT count(*) FROM "Organization";' 2>/dev/null | tr -d ' \n' || echo "0")

  # Sanitizar: si no es número (tabla no existe aún, etc.), tratar como 0
  if ! echo "$ORG_COUNT" | grep -qE '^[0-9]+$'; then
    ORG_COUNT=0
  fi

  if [[ "$ORG_COUNT" -gt 0 ]]; then
    log "La base de datos tiene datos (organizaciones: $ORG_COUNT)"
    SEED_NEEDED=false
  else
    warn "La base de datos está vacía"
    SEED_NEEDED=true
  fi
fi

# ---------------------------------------------------------------------------
# Paso 5: Seed (según modo y estado)
# ---------------------------------------------------------------------------
run_seed() {
  local label="$1"
  info "$label"
  echo ""

  if [[ "$DRY_RUN" = true ]]; then
    dryrun "npx tsx prisma/seed.ts"
    return
  fi

  API_RUNNING=$(docker ps --filter "name=^${API_CONTAINER}$" --filter "status=running" -q 2>/dev/null || true)

  if [[ -n "$API_RUNNING" ]]; then
    docker exec "$API_CONTAINER" sh -c "cd /app/packages/database && npx tsx prisma/seed.ts"
  elif docker images --format '{{.Repository}}:{{.Tag}}' 2>/dev/null | grep -q "construccion"; then
    cd "$ROOT_DIR"
    $COMPOSE_CMD run --rm --no-deps \
      -e DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@postgres:5432/${DB_NAME}" \
      api sh -c "cd /app/packages/database && npx tsx prisma/seed.ts"
  elif command -v npx &>/dev/null; then
    cd "$ROOT_DIR/packages/database"
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}" \
      npx tsx prisma/seed.ts
  else
    warn "No se pudo ejecutar el seed automáticamente."
    warn "Ejecutá manualmente: pnpm db:seed  o  RUN_SEED=force docker compose up api"
    return
  fi

  log "Seed completado"
}

step "Carga de datos (seed)"

case "$SEED_MODE" in
  skip)
    info "Seed omitido (--no-seed)"
    ;;
  force)
    warn "Forzando re-seed. Los datos existentes serán reemplazados."
    if [[ "$DRY_RUN" = false ]]; then
      read -rp "  ¿Confirmás? (escribí 'si' para continuar): " confirm
      echo ""
      if [[ "$confirm" != "si" ]]; then
        info "Re-seed cancelado."
      else
        run_seed "Ejecutando seed con datos de demo..."
      fi
    else
      dryrun "Re-seed completo (requiere confirmación en modo real)"
    fi
    ;;
  auto)
    if [[ "$SEED_NEEDED" = true ]]; then
      run_seed "Base vacía — cargando datos de demo..."
    else
      info "La base ya tiene datos. Seed omitido."
      info "Usá --force-seed para recargar datos de demo."
    fi
    ;;
esac

# ---------------------------------------------------------------------------
# Resumen final
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
if [[ "$DRY_RUN" = true ]]; then
echo -e "${GREEN}║   ${BOLD}DRY-RUN completado${NC}${GREEN}                             ║${NC}"
else
echo -e "${GREEN}║   ${BOLD}Sincronización completada${NC}${GREEN}                      ║${NC}"
fi
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

if [[ "$DRY_RUN" = false ]]; then
  echo -e "${BOLD}Próximos pasos:${NC}"
  echo ""

  API_RUNNING_FINAL=$(docker ps --filter "name=^${API_CONTAINER}$" --filter "status=running" -q 2>/dev/null || true)
  if [[ -z "$API_RUNNING_FINAL" ]]; then
    echo -e "  ${CYAN}Levantar stack completo:${NC}   $COMPOSE_CMD up -d"
    echo -e "  ${CYAN}Solo reconstruir:${NC}          $COMPOSE_CMD build api web --no-cache && $COMPOSE_CMD up -d api web"
  else
    echo -e "  ${CYAN}Regenerar Prisma Client:${NC}   pnpm db:generate"
    echo -e "  ${CYAN}Reiniciar API:${NC}             $COMPOSE_CMD restart api"
  fi

  echo ""
  echo -e "  ${CYAN}Aplicación:${NC}  http://localhost:3000"
  echo -e "  ${CYAN}API:${NC}         http://localhost:3001/api/v1"
  echo ""
  echo -e "  ${YELLOW}Admin:${NC}  admin@constructorademo.com.ar / password123"
  echo ""
fi
