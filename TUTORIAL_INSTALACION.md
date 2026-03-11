# Tutorial de Instalación

## Opción A — Docker (recomendada)

### Qué necesitás antes de empezar

Solo necesitás tener instalado **Docker Desktop** en tu computadora.

| Sistema | Descarga |
|---------|----------|
| Windows / Mac | https://www.docker.com/products/docker-desktop |
| Linux | https://docs.docker.com/engine/install/ |

> Una vez instalado, abrilo y asegurate de que esté corriendo (icono de la ballena en la barra de tareas).

---

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/abrojodigital/construccion-app.git
cd construccion-app
```

---

### Paso 2 — Ejecutar el instalador

```bash
./setup.sh
```

El script ejecuta automáticamente:

```
[1/4] Verificando prerequisitos...        ← Chequea Docker
[2/4] Verificando puertos disponibles...  ← Chequea que 3000, 3001, 5432 estén libres
[3/4] Construyendo e iniciando servicios  ← Build de imágenes + Docker Compose (~5 min)
[4/4] Esperando a que todo esté listo...  ← Migra la DB y carga datos de demo
```

Al finalizar verás:

```
  Instalación completada!

  Aplicación:  http://localhost:3000
  API:         http://localhost:3001/api/v1
```

---

### Paso 3 — Ingresar al sistema

Abrí el navegador en **http://localhost:3000** y usá estas credenciales:

```
Email:    admin@constructorademo.com.ar
Password: password123
```

### Todos los usuarios disponibles

| Rol | Email | Puede hacer |
|-----|-------|-------------|
| Administrador | admin@constructorademo.com.ar | Acceso total |
| Jefe de Obra | jefe@constructorademo.com.ar | Proyectos, rubros, tareas, gastos |
| Supervisor | supervisor@constructorademo.com.ar | Ver y actualizar avance en obra |
| Administrativo | admin2@constructorademo.com.ar | Gastos, presupuestos, certificaciones |
| Solo Lectura | lector@constructorademo.com.ar | Solo consulta |

> Todas las cuentas usan la contraseña: **password123**

---

### Datos de demo incluidos

El sistema viene cargado con datos realistas de la organización demo **"Constructora Patagonia S.A."**:

**Proyecto principal: Red Cloacal** con datos reales de construcción
- Rubros y tareas con fechas planificadas
- Presupuesto versionado con coeficiente K calculado
- Análisis de Precios Unitarios (APU) con materiales, mano de obra y equipos
- Avance físico registrado por ítem
- Certificados de obra con deducciones
- Monedas (ARS, USD, EUR) con tipos de cambio históricos
- Índices de precios INDEC con valores históricos
- Fórmulas de redeterminación de precios

**Datos maestros:**
- 6 usuarios con distintos roles
- Empleados, proveedores y materiales con stock
- Gastos en todos los estados (borrador, pendiente, aprobado, pagado, rechazado)

---

### Operaciones comunes

```bash
# Detener el sistema (los datos se mantienen)
docker compose down

# Volver a iniciarlo
docker compose up -d

# Ver si todo está corriendo
docker compose ps

# Ver logs en tiempo real
docker compose logs -f api

# Reconstruir después de actualizar el código
docker compose build api web --no-cache
docker compose up -d api web

# Borrar todo y empezar de cero (borra la base de datos)
docker compose down -v
./setup.sh
```

Estado esperado de los contenedores:

```
NAME               STATUS                  PORTS
construccion-db    Up (healthy)            5432
construccion-api   Up (healthy)            3001
construccion-web   Up                      3000
```

---

### Problemas frecuentes

**"Puerto en uso"**

Algo ya está usando el puerto 3000, 3001 o 5432. Si es una instancia anterior:
```bash
docker compose down
```
Si es otro servicio, detenerlo antes de ejecutar `./setup.sh`.

**El build tarda mucho o falla**

Asegurate de que Docker tenga al menos **4 GB de RAM** asignados:
Docker Desktop → Settings → Resources → Memory

**No puedo acceder a localhost:3000**

1. Verificar que los containers estén corriendo: `docker compose ps`
2. Esperar 1–2 minutos (la primera vez tarda más)
3. Verificar logs: `docker compose logs api`

---

## Opción B — Desarrollo local (sin Docker)

Para trabajar sobre el código fuente directamente.

### Prerequisitos

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- PostgreSQL >= 14 corriendo localmente
- Git

### Instalación

```bash
# 1. Clonar
git clone https://github.com/abrojodigital/construccion-app.git
cd construccion-app

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Editá `apps/api/.env` con tu configuración local:

```env
NODE_ENV=development
API_PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/construccion_db"
JWT_SECRET=un-secreto-largo-y-aleatorio
JWT_REFRESH_SECRET=otro-secreto-largo-y-aleatorio
CORS_ORIGIN=http://localhost:3000
```

Editá `apps/web/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

```bash
# 4. Crear la base de datos en PostgreSQL
createdb construccion_db

# 5. Sincronizar schema y generar cliente Prisma
pnpm db:push

# 6. Cargar datos de demo
pnpm db:seed

# 7. Iniciar en modo desarrollo (API en :3001 + Web en :3000)
pnpm dev
```

### Comandos de desarrollo

```bash
pnpm dev              # Inicia todo en paralelo
pnpm dev:api          # Solo API (tsx watch)
pnpm dev:web          # Solo Next.js

pnpm build            # Build de producción (Turborepo)
pnpm typecheck        # TypeScript estricto en todos los paquetes
pnpm lint             # ESLint
pnpm lint:fix         # ESLint con auto-fix
pnpm format           # Prettier

pnpm db:push          # Sincronizar schema Prisma con la DB
pnpm db:migrate:dev   # Crear migración con nombre
pnpm db:seed          # Cargar datos demo
pnpm db:studio        # Prisma Studio visual (puerto 5555)
pnpm db:generate      # Regenerar cliente Prisma
pnpm db:reset         # Borrar todos los datos y recrear
```
