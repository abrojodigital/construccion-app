#!/bin/bash
# =============================================
# Setup Script - Sistema de Gestion de Construccion
# Instalacion con un solo comando
# =============================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                  ║${NC}"
echo -e "${BLUE}║   ${BOLD}Sistema de Gestion de Construccion${NC}${BLUE}             ║${NC}"
echo -e "${BLUE}║   ${CYAN}Instalacion automatica${NC}${BLUE}                         ║${NC}"
echo -e "${BLUE}║                                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ------------------------------------------
# 1. Verificar prerequisitos
# ------------------------------------------
echo -e "${YELLOW}[1/4]${NC} Verificando prerequisitos..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker no esta instalado.${NC}"
    echo ""
    echo "Instala Docker Desktop desde:"
    echo "  - Mac/Windows: https://www.docker.com/products/docker-desktop"
    echo "  - Linux:       https://docs.docker.com/engine/install/"
    echo ""
    exit 1
fi

# Verificar Docker Compose
if ! docker compose version &> /dev/null; then
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}ERROR: Docker Compose no esta disponible.${NC}"
        echo ""
        echo "Docker Compose viene incluido con Docker Desktop."
        echo "Si usas Linux, instala el plugin: https://docs.docker.com/compose/install/"
        echo ""
        exit 1
    fi
    # Usar docker-compose legacy
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# Verificar que Docker esta corriendo
if ! docker info &> /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker no esta corriendo.${NC}"
    echo ""
    echo "Inicia Docker Desktop y vuelve a ejecutar este script."
    echo ""
    exit 1
fi

echo -e "  ${GREEN}Docker:${NC}          $(docker --version | head -1)"
echo -e "  ${GREEN}Docker Compose:${NC}  $($COMPOSE_CMD version | head -1)"
echo ""

# ------------------------------------------
# 2. Verificar puertos disponibles
# ------------------------------------------
echo -e "${YELLOW}[2/4]${NC} Verificando puertos disponibles..."

check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tlnp 2>/dev/null | grep -q ":$port " 2>/dev/null; then
        echo -e "${RED}ERROR: El puerto $port esta en uso (necesario para $service).${NC}"
        echo ""
        echo "Opciones:"
        echo "  1. Detener el servicio que usa el puerto $port"
        echo "  2. Si es una instancia anterior, ejecutar: $COMPOSE_CMD down"
        echo ""
        exit 1
    fi
}

check_port 3000 "Frontend (Web)"
check_port 3001 "Backend (API)"
check_port 5432 "PostgreSQL"

echo -e "  ${GREEN}Puertos 3000, 3001, 5432 disponibles${NC}"
echo ""

# ------------------------------------------
# 3. Construir y levantar servicios
# ------------------------------------------
echo -e "${YELLOW}[3/4]${NC} Construyendo e iniciando servicios..."
echo ""
echo -e "  ${CYAN}Esto puede tomar 3-8 minutos la primera vez...${NC}"
echo ""

# Build
$COMPOSE_CMD build --parallel 2>&1 | while IFS= read -r line; do
    echo "  $line"
done

echo ""
echo -e "  ${GREEN}Build completado!${NC}"
echo ""

# Start services
echo -e "  Iniciando servicios..."
$COMPOSE_CMD up -d

echo ""

# ------------------------------------------
# 4. Esperar a que todo este listo
# ------------------------------------------
echo -e "${YELLOW}[4/4]${NC} Esperando a que los servicios esten listos..."
echo ""

# Esperar a la API (incluye migrate + seed)
MAX_WAIT=120
WAITED=0
API_READY=false

while [ $WAITED -lt $MAX_WAIT ]; do
    # Verificar si el container sigue corriendo
    if ! docker ps --filter "name=construccion-api" --filter "status=running" -q | grep -q .; then
        # Verificar si el container fallo
        EXIT_CODE=$(docker inspect construccion-api --format='{{.State.ExitCode}}' 2>/dev/null || echo "unknown")
        if [ "$EXIT_CODE" != "0" ] && [ "$EXIT_CODE" != "unknown" ]; then
            echo -e "${RED}ERROR: El container de la API fallo al iniciar.${NC}"
            echo ""
            echo "Logs del container:"
            docker logs construccion-api --tail 30
            echo ""
            echo "Para mas detalles: docker logs construccion-api"
            exit 1
        fi
    fi

    # Verificar health check
    HEALTH=$(docker inspect construccion-api --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    if [ "$HEALTH" = "healthy" ]; then
        API_READY=true
        break
    fi

    # Mostrar estado
    printf "\r  Esperando... (%ds/%ds) - Estado: %s  " $WAITED $MAX_WAIT "$HEALTH"
    sleep 3
    WAITED=$((WAITED + 3))
done

echo ""

if [ "$API_READY" = false ]; then
    echo -e "${YELLOW}AVISO: La API esta tardando mas de lo esperado.${NC}"
    echo "  Puede que aun este ejecutando migraciones y seed."
    echo "  Verifica los logs: docker logs construccion-api -f"
    echo ""
fi

# Esperar al frontend
WAITED=0
WEB_READY=false

while [ $WAITED -lt 60 ]; do
    HEALTH=$(docker inspect construccion-web --format='{{if .State.Running}}running{{end}}' 2>/dev/null || echo "")
    if [ "$HEALTH" = "running" ]; then
        # Intentar conectar
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200\|302\|304"; then
            WEB_READY=true
            break
        fi
    fi
    sleep 2
    WAITED=$((WAITED + 2))
done

echo ""

# ------------------------------------------
# Resumen final
# ------------------------------------------
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║   ${BOLD}Instalacion completada!${NC}${GREEN}                        ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}URLs de acceso:${NC}"
echo -e "  ${CYAN}Aplicacion:${NC}  http://localhost:3000"
echo -e "  ${CYAN}API:${NC}         http://localhost:3001/api/v1"
echo ""
echo -e "${BOLD}Credenciales de acceso:${NC}"
echo ""
echo -e "  ${YELLOW}Administrador:${NC}"
echo -e "    Email:    admin@constructorademo.com.ar"
echo -e "    Password: password123"
echo ""
echo -e "  ${YELLOW}Jefe de Obra:${NC}"
echo -e "    Email:    jefe@constructorademo.com.ar"
echo -e "    Password: password123"
echo ""
echo -e "  ${YELLOW}Project Manager:${NC}"
echo -e "    Email:    andres.pm@constructorademo.com.ar"
echo -e "    Password: password123"
echo ""
echo -e "  ${YELLOW}Supervisor:${NC}"
echo -e "    Email:    supervisor@constructorademo.com.ar"
echo -e "    Password: password123"
echo ""
echo -e "  ${YELLOW}Contable:${NC}"
echo -e "    Email:    admin.contable@constructorademo.com.ar"
echo -e "    Password: password123"
echo ""
echo -e "  ${YELLOW}Cliente (Solo lectura):${NC}"
echo -e "    Email:    cliente@ejemplo.com.ar"
echo -e "    Password: password123"
echo ""
echo -e "${BOLD}Comandos utiles:${NC}"
echo -e "  ${CYAN}Ver logs:${NC}       $COMPOSE_CMD logs -f"
echo -e "  ${CYAN}Detener:${NC}        $COMPOSE_CMD down"
echo -e "  ${CYAN}Reiniciar:${NC}      $COMPOSE_CMD restart"
echo -e "  ${CYAN}Reconstruir:${NC}    $COMPOSE_CMD up -d --build"
echo -e "  ${CYAN}Reset total:${NC}    $COMPOSE_CMD down -v && $COMPOSE_CMD up -d --build"
echo ""
echo -e "${BOLD}Proyectos de demo incluidos:${NC}"
echo -e "  1. Casa Familia Rodriguez - Nordelta (En progreso 65%)"
echo -e "  2. Edificio Mirador del Parque (En progreso 28%)"
echo -e "  3. Remodelacion Local Comercial - Florida (En planificacion)"
echo -e "  4. Duplex Familia Lopez - Escobar (Completado 100%)"
echo ""
