#!/usr/bin/env bash
# export-project.sh — Empaqueta el proyecto sin historial Git ni dependencias.
# Uso: ./scripts/export-project.sh [nombre-salida]
# Ejemplo: ./scripts/export-project.sh construccion-app-2026-03-12

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
TIMESTAMP="$(date +%Y-%m-%d)"
OUTPUT_NAME="${1:-${PROJECT_NAME}-${TIMESTAMP}}"
OUTPUT_FILE="${PROJECT_ROOT}/../${OUTPUT_NAME}.zip"

echo "→ Proyecto: $PROJECT_ROOT"
echo "→ Destino:  $OUTPUT_FILE"
echo ""

# Directorios y archivos a excluir
EXCLUDES=(
  ".git"
  ".git/*"
  "node_modules"
  "node_modules/*"
  "*/node_modules"
  "*/node_modules/*"
  ".next"
  "*/.next"
  "*/.next/*"
  "dist"
  "*/dist"
  "*/dist/*"
  ".turbo"
  "*/.turbo"
  "backups"
  "backups/*"
  "*.log"
  ".DS_Store"
  "*.DS_Store"
  "*.tsbuildinfo"
  "coverage"
  "*/coverage"
)

# Construir los argumentos de exclusión para zip
EXCLUDE_ARGS=()
for pattern in "${EXCLUDES[@]}"; do
  EXCLUDE_ARGS+=("--exclude=${PROJECT_NAME}/${pattern}")
done

# Cambiar al directorio padre para que el zip tenga una carpeta raíz limpia
cd "$PROJECT_ROOT/.."

echo "→ Generando ZIP..."
zip -r "$OUTPUT_FILE" "$PROJECT_NAME" \
  "${EXCLUDE_ARGS[@]}" \
  2>&1 | grep -v "^\s*$" | tail -5 || true

# Verificar que el archivo fue creado
if [[ -f "$OUTPUT_FILE" ]]; then
  SIZE=$(du -sh "$OUTPUT_FILE" | cut -f1)
  echo ""
  echo "✓ Exportación completada: $OUTPUT_FILE ($SIZE)"
  echo ""
  echo "Para transferir a otra computadora:"
  echo "  scp $OUTPUT_FILE usuario@servidor:~/"
  echo "  # o simplemente copiar el archivo .zip"
  echo ""
  echo "En la computadora destino:"
  echo "  unzip ${OUTPUT_NAME}.zip"
  echo "  cd ${OUTPUT_NAME}"
  echo "  cp apps/api/.env.example apps/api/.env"
  echo "  cp apps/web/.env.example apps/web/.env"
  echo "  # Editar los .env con los valores correctos"
  echo "  ./setup.sh   # Docker: levanta todo automáticamente"
  echo "  # o: pnpm install && pnpm dev  (sin Docker)"
else
  echo "✗ Error: no se pudo crear el archivo ZIP."
  exit 1
fi
