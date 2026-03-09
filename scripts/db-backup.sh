#!/usr/bin/env bash
# =============================================================================
# db-backup.sh — Backup y restore de la base de datos PostgreSQL (via Docker)
#
# Uso:
#   ./scripts/db-backup.sh backup            # Backup con timestamp automático
#   ./scripts/db-backup.sh backup mi-nombre  # Backup con nombre personalizado
#   ./scripts/db-backup.sh restore           # Restore interactivo (lista backups)
#   ./scripts/db-backup.sh restore mi-nombre # Restore de un backup específico
#   ./scripts/db-backup.sh list              # Listar backups disponibles
#   ./scripts/db-backup.sh delete            # Eliminar un backup (interactivo)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -f "$ROOT_DIR/.env" ]]; then
  while IFS='=' read -r key val; do
    [[ "$key" =~ ^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)$ ]] && export "$key=$val"
  done < <(grep -E '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=' "$ROOT_DIR/.env" 2>/dev/null || true)
fi

DB_CONTAINER="${DB_CONTAINER:-construccion-db}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASS="${POSTGRES_PASSWORD:-postgres123}"
DB_NAME="${POSTGRES_DB:-construccion_db}"
BACKUP_DIR="$ROOT_DIR/backups"

# Colores
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
heading() { echo -e "\n${BOLD}${CYAN}$*${NC}"; }

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
check_docker() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${DB_CONTAINER}$" || \
    error "El contenedor '$DB_CONTAINER' no está corriendo. Ejecutá: docker compose up -d postgres"
}

ensure_backup_dir() {
  mkdir -p "$BACKUP_DIR"
}

# Devuelve lista de backups ordenados por fecha (más reciente primero), uno por línea
get_backups() {
  ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | xargs -I{} basename {} || true
}

count_backups() {
  get_backups | grep -c '.' 2>/dev/null || echo 0
}

print_backup_list() {
  local total
  total=$(count_backups)

  if [[ "$total" -eq 0 ]]; then
    warn "No hay backups disponibles en $BACKUP_DIR"
    return 1
  fi

  echo ""
  printf "  %-4s  %-50s  %-10s\n" "N°" "Nombre" "Tamaño"
  printf "  %-4s  %-50s  %-10s\n" "----" "--------------------------------------------------" "--------"

  local i=1
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    local filepath="$BACKUP_DIR/$file"
    local size
    size="$(du -sh "$filepath" 2>/dev/null | cut -f1)"
    local name="${file%.dump}"
    printf "  %-4s  %-50s  %-10s\n" "[$i]" "$name" "$size"
    i=$((i + 1))
  done < <(get_backups)
  echo ""
}

# Dado un número N, devuelve el nombre del backup N-ésimo
get_backup_by_index() {
  local idx="$1"
  get_backups | sed -n "${idx}p"
}

# ---------------------------------------------------------------------------
# Comando: backup
# ---------------------------------------------------------------------------
cmd_backup() {
  local name="${1:-}"
  heading "📦 Creando backup de la base de datos"

  check_docker
  ensure_backup_dir

  local timestamp
  timestamp="$(date '+%Y%m%d_%H%M%S')"
  local filename
  if [[ -n "$name" ]]; then
    filename="${name}_${timestamp}.dump"
  else
    filename="${DB_NAME}_${timestamp}.dump"
  fi
  local filepath="$BACKUP_DIR/$filename"

  info "Base de datos : $DB_NAME"
  info "Contenedor    : $DB_CONTAINER"
  info "Archivo       : backups/$filename"
  echo ""

  docker exec -e PGPASSWORD="$DB_PASS" "$DB_CONTAINER" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc \
    > "$filepath"

  local size
  size="$(du -sh "$filepath" | cut -f1)"
  log "Backup creado: backups/$filename ($size)"
}

# ---------------------------------------------------------------------------
# Comando: restore
# ---------------------------------------------------------------------------
cmd_restore() {
  local name="${1:-}"
  heading "♻️  Restaurando backup de la base de datos"

  check_docker
  ensure_backup_dir

  local filepath=""

  if [[ -n "$name" ]]; then
    if [[ -f "$BACKUP_DIR/${name}.dump" ]]; then
      filepath="$BACKUP_DIR/${name}.dump"
    elif [[ -f "$BACKUP_DIR/$name" ]]; then
      filepath="$BACKUP_DIR/$name"
    else
      error "Backup no encontrado: $name"
    fi
  else
    print_backup_list || exit 1

    read -rp "  Seleccioná el número del backup a restaurar: " choice
    echo ""

    if ! echo "$choice" | grep -qE '^[0-9]+$'; then
      error "Selección inválida"
    fi

    local total
    total=$(count_backups)
    if [[ "$choice" -lt 1 || "$choice" -gt "$total" ]]; then
      error "Selección fuera de rango (1-$total)"
    fi

    local selected
    selected="$(get_backup_by_index "$choice")"
    filepath="$BACKUP_DIR/$selected"
  fi

  local filename
  filename="$(basename "$filepath")"

  info "Backup a restaurar : ${filename%.dump}"
  info "Base de datos      : $DB_NAME"
  echo ""
  warn "Esto REEMPLAZARÁ todos los datos actuales de '$DB_NAME'."
  read -rp "  ¿Confirmás? (escribí 'si' para continuar): " confirm
  echo ""

  if [[ "$confirm" != "si" ]]; then
    info "Operación cancelada."
    exit 0
  fi

  # Backup de seguridad automático antes de restaurar
  info "Creando backup de seguridad antes de restaurar..."
  local safety_file="$BACKUP_DIR/pre-restore_$(date '+%Y%m%d_%H%M%S').dump"
  docker exec -e PGPASSWORD="$DB_PASS" "$DB_CONTAINER" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc \
    > "$safety_file"
  log "Backup de seguridad: $(basename "$safety_file")"
  echo ""

  # Copiar dump al contenedor y restaurar
  info "Restaurando..."
  local container_path="/tmp/restore_$$.dump"

  docker cp "$filepath" "$DB_CONTAINER:$container_path"

  # Terminar conexiones activas
  docker exec -e PGPASSWORD="$DB_PASS" "$DB_CONTAINER" \
    psql -U "$DB_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true

  # Restaurar (--clean elimina objetos existentes antes de recrearlos)
  docker exec -e PGPASSWORD="$DB_PASS" "$DB_CONTAINER" \
    pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists -Fc "$container_path" \
    2>&1 | grep -Ev "^(pg_restore:|$)" || true

  docker exec "$DB_CONTAINER" rm -f "$container_path"

  log "Base de datos restaurada exitosamente desde: ${filename%.dump}"
}

# ---------------------------------------------------------------------------
# Comando: list
# ---------------------------------------------------------------------------
cmd_list() {
  heading "📋 Backups disponibles"
  ensure_backup_dir
  print_backup_list || true
  info "Directorio: $BACKUP_DIR"
}

# ---------------------------------------------------------------------------
# Comando: delete
# ---------------------------------------------------------------------------
cmd_delete() {
  local name="${1:-}"
  heading "🗑️  Eliminar backup"
  ensure_backup_dir

  local filepath=""

  if [[ -n "$name" ]]; then
    if [[ -f "$BACKUP_DIR/${name}.dump" ]]; then
      filepath="$BACKUP_DIR/${name}.dump"
    elif [[ -f "$BACKUP_DIR/$name" ]]; then
      filepath="$BACKUP_DIR/$name"
    else
      error "Backup no encontrado: $name"
    fi
  else
    print_backup_list || exit 1

    read -rp "  Seleccioná el número del backup a eliminar: " choice
    echo ""

    if ! echo "$choice" | grep -qE '^[0-9]+$'; then
      error "Selección inválida"
    fi

    local total
    total=$(count_backups)
    if [[ "$choice" -lt 1 || "$choice" -gt "$total" ]]; then
      error "Selección fuera de rango (1-$total)"
    fi

    local selected
    selected="$(get_backup_by_index "$choice")"
    filepath="$BACKUP_DIR/$selected"
  fi

  warn "Vas a eliminar: $(basename "$filepath")"
  read -rp "  ¿Confirmás? (s/N): " confirm
  echo ""

  if [[ "$confirm" =~ ^[sS]$ ]]; then
    rm "$filepath"
    log "Backup eliminado: $(basename "$filepath")"
  else
    info "Operación cancelada."
  fi
}

# ---------------------------------------------------------------------------
# Ayuda
# ---------------------------------------------------------------------------
cmd_help() {
  echo ""
  echo -e "${BOLD}Herramienta de Backup/Restore — Base de Datos PostgreSQL${NC}"
  echo ""
  echo "  Uso: ./scripts/db-backup.sh <comando> [nombre]"
  echo ""
  echo "  Comandos:"
  printf "    %-30s %s\n" "backup [nombre]"    "Crear un backup (nombre opcional)"
  printf "    %-30s %s\n" "restore [nombre]"   "Restaurar un backup (interactivo si se omite)"
  printf "    %-30s %s\n" "list"               "Listar todos los backups disponibles"
  printf "    %-30s %s\n" "delete [nombre]"    "Eliminar un backup"
  echo ""
  echo "  Ejemplos:"
  echo "    ./scripts/db-backup.sh backup"
  echo "    ./scripts/db-backup.sh backup antes-de-migracion"
  echo "    ./scripts/db-backup.sh restore"
  echo "    ./scripts/db-backup.sh restore antes-de-migracion_20250309_143022"
  echo "    ./scripts/db-backup.sh list"
  echo ""
  echo "  Los backups se guardan en: ./backups/"
  echo "  Nota: al restaurar se crea un backup de seguridad automáticamente."
  echo ""
}

# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
COMMAND="${1:-help}"
shift 2>/dev/null || true

case "$COMMAND" in
  backup)  cmd_backup "${1:-}" ;;
  restore) cmd_restore "${1:-}" ;;
  list)    cmd_list ;;
  delete)  cmd_delete "${1:-}" ;;
  help|--help|-h) cmd_help ;;
  *) warn "Comando desconocido: $COMMAND"; cmd_help; exit 1 ;;
esac
