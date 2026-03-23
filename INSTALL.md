# Guia de Instalacion - Sistema de Gestion de Construccion

## Prerequisitos

- **Docker Desktop** (incluye Docker Compose)
  - [Mac / Windows](https://www.docker.com/products/docker-desktop)
  - [Linux](https://docs.docker.com/engine/install/)
- **Git** (para clonar el repositorio)
- **Puertos disponibles:** 3000, 3001, 5432

---

## Instalacion rapida

```bash
git clone <url-del-repositorio>
cd construccion-app
./setup.sh
```

El script automaticamente:
1. Verifica que Docker este instalado y corriendo
2. Verifica que los puertos necesarios esten disponibles
3. Construye las imagenes Docker (3-8 min la primera vez)
4. Levanta PostgreSQL, API y Frontend
5. Ejecuta migraciones de base de datos
6. Carga datos de demo (4 proyectos completos)
7. Muestra las URLs y credenciales de acceso

---

## Acceso al sistema

| URL | Servicio |
|-----|----------|
| http://localhost:3000 | Aplicacion web |
| http://localhost:3001/api/v1 | API REST |

### Credenciales de demo

| Rol | Email | Password |
|-----|-------|----------|
| ADMIN | admin@constructorademo.com.ar | password123 |
| PROJECT_MANAGER | jefe@constructorademo.com.ar | password123 |
| SUPERVISOR | supervisor@constructorademo.com.ar | password123 |
| ADMINISTRATIVE | admin2@constructorademo.com.ar | password123 |
| READ_ONLY | lector@constructorademo.com.ar | password123 |

### Datos de demo incluidos

- **Organización:** Constructora Patagonia S.A.
- **3 proyectos** con presupuestos, APUs, certificaciones y avance físico
- **65 equipos** en el catálogo (EQ-GEN y EQ-PRY) con costos horarios calculados
- **4 categorías de Mano de Obra** con tarifas MMO Feb-26

---

## Comandos utiles

```bash
# Ver estado de los servicios
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio especifico
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres

# Detener todos los servicios
docker compose down

# Reiniciar servicios
docker compose restart

# Reiniciar un servicio especifico
docker compose restart api

# Reconstruir y reiniciar (despues de cambios en el codigo)
docker compose build api web --no-cache && docker compose up -d api web

# Reset completo (borra la base de datos y vuelve a cargar datos de demo)
docker compose down -v
docker compose up -d --build
```

---

## Actualizar a una version nueva

Luego de hacer `git pull` con cambios en el schema o los catálogos:

```bash
# 1. Sincronizar esquema + actualizar catálogos (siempre seguro, usa upsert)
./scripts/db-sync.sh

# 2. Si hubo cambios de código, reconstruir las imágenes
docker compose build api web --no-cache && docker compose up -d api web
```

`db-sync.sh` ejecuta en orden: `prisma db push` → upsert de catálogos (4 MdO + 65 equipos) → seed si la base está vacía.

---

## Configuracion avanzada

### Variables de entorno

Puedes crear un archivo `.env` en la raiz del proyecto para personalizar la configuracion:

```env
# Base de datos
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
POSTGRES_DB=construccion_db

# JWT
JWT_SECRET=mi-secreto-seguro
JWT_REFRESH_SECRET=mi-refresh-secreto
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# Seed de datos
RUN_SEED=true          # true: seed si DB vacia, false: nunca, force: siempre

# URLs (cambiar si usas otros puertos)
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Control del seed de datos

La variable `RUN_SEED` controla la carga de datos de demo:

| Valor | Comportamiento |
|-------|---------------|
| `true` (default) | Carga datos de demo solo si la base de datos esta vacia |
| `false` | Nunca carga datos de demo |
| `force` | Siempre re-carga datos de demo al iniciar |

---

## Troubleshooting

### El build falla con error de memoria

Docker necesita al menos **4GB de RAM** asignados. En Docker Desktop:
- Ir a Settings > Resources > Memory
- Asignar al menos 4GB

### "Puerto en uso"

Otro servicio esta usando el puerto. Opciones:

```bash
# Ver que esta usando el puerto
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Si es una instancia anterior de este sistema
docker compose down
```

### La API no inicia / errores de base de datos

```bash
# Ver logs de la API
docker compose logs api

# Ver logs de PostgreSQL
docker compose logs postgres

# Reiniciar todo desde cero
docker compose down -v
docker compose up -d --build
```

### El frontend no se conecta a la API

Verificar que la API este healthy:

```bash
# Verificar estado
docker compose ps

# Probar la API directamente
curl http://localhost:3001/api/v1/health
```

### Limpiar todo y empezar de cero

```bash
# Detener y borrar todo (incluyendo datos)
docker compose down -v --rmi all

# Reconstruir desde cero
docker compose up -d --build
```

---

## Arquitectura Docker

```
                    ┌──────────────┐
                    │   Browser    │
                    │ :3000        │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Frontend   │
                    │   (Next.js)  │
                    │   :3000      │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   Backend    │
                    │  (Express)   │
                    │   :3001      │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │   :5432      │
                    └──────────────┘
```

Todos los servicios corren en una red Docker interna (`construccion-network`).
Los datos de PostgreSQL persisten en un volumen Docker (`postgres_data`).
