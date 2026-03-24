# Scripts de administración

## `setup.sh` — Instalación inicial

Levanta todo el stack por primera vez (Docker build + start + seed).

```bash
./setup.sh
```

Prerequisitos: Docker instalado y corriendo, puertos 3000, 3001 y 5432 libres.

---

## `scripts/db-sync.sh` — Sincronización de base de datos

Sincroniza el esquema Prisma con PostgreSQL y mantiene los catálogos actualizados. Útil al llevar el proyecto a una nueva máquina o luego de un `git pull` con cambios en el schema.

```bash
./scripts/db-sync.sh               # Sync + catálogos + seed automático si la BD está vacía
./scripts/db-sync.sh --no-seed     # Solo sincroniza esquema y catálogos, no toca datos de demo
./scripts/db-sync.sh --force-seed  # Sync + catálogos + re-seed completo (reemplaza datos)
./scripts/db-sync.sh --dry-run     # Muestra qué haría sin ejecutar nada
```

### Pasos que ejecuta el script

**Paso 1 — Verificación de Docker**

Comprueba que Docker esté corriendo y que `docker compose` esté disponible. Si Docker no está activo, el script aborta con un mensaje de error.

**Paso 2 — Contenedor de PostgreSQL**

Levanta el contenedor de PostgreSQL si no está corriendo (`docker compose up -d postgres`). Espera a que el motor de base de datos esté listo para aceptar conexiones antes de continuar.

**Paso 3 — Sincronización del esquema (prisma db push)**

Aplica el schema de Prisma a la base de datos sin generar archivos de migración. El script elige automáticamente cómo ejecutar Prisma según lo que esté disponible: contenedor API corriendo, `docker compose run`, o `npx` local.

**Paso 4 — Actualización de catálogos**

Siempre se ejecuta, independientemente de si la base tiene datos o no. Hace un upsert de los registros de catálogo del sistema:

- **4 categorías laborales (LaborCategory):** OF-ESP, OF, MO, AY con las tarifas horarias MMO de Febrero 2026 ($6.071/h, $5.196/h, $4.793/h, $4.438/h respectivamente).
- **60 equipos del catálogo (EquipmentCatalogItem):**
  - 33 equipos genéricos (EQ-GEN-01 a EQ-GEN-33), cotizados con dólar a $1.390.
  - 27 equipos del proyecto (EQ-PRY-01 a EQ-PRY-27), cotizados con dólar a $1.450.

Esta operación es **idempotente**: puede ejecutarse múltiples veces sin duplicar registros. Usa upsert por `(organizationId, code)` como clave compuesta, por lo que actualiza los precios si ya existen y los crea si son nuevos.

**Paso 5 — Seed de datos de demo**

Solo se ejecuta si la base de datos está vacía (no hay organizaciones registradas) o si se usó el flag `--force-seed`. Carga la organización demo "Constructora Patagonia S.A." con proyectos, usuarios, presupuestos, APUs, certificaciones y demás datos de ejemplo.

---

## `scripts/import-mmo-equipos.ts` — Importación de catálogos MMO y equipos

Actualiza las tarifas de mano de obra y los precios de equipos del catálogo APU. Es el mismo script que invoca `db-sync.sh` en el paso 4, pero puede ejecutarse de forma independiente cuando solo se necesita actualizar precios sin hacer un sync completo.

```bash
# Ejecutar directamente (requiere PostgreSQL accesible)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/construccion_db" \
  npx tsx scripts/import-mmo-equipos.ts
```

### Qué actualiza

**Categorías laborales (LaborCategory) — 4 registros:**

Actualiza las tarifas horarias de mano de obra según el Convenio Colectivo de la Construcción (UOCRA). Los datos provienen de la planilla **MMO FEB-26.xlsx**:

| Código | Categoría | Tarifa base | Costo total/h (con cargas) |
|--------|-----------|-------------|---------------------------|
| OF-ESP | Oficial Especializado | $6.071/h | ~$11.888/h |
| OF | Oficial | $5.196/h | ~$10.172/h |
| MO | Medio Oficial | $4.793/h | ~$9.383/h |
| AY | Ayudante | $4.438/h | ~$8.688/h |

Cargas aplicadas: Presentismo 20% + Cargas sociales 59% + ART 7,9%.

**Equipos del catálogo (EquipmentCatalogItem) — 60 registros:**

Actualiza los costos horarios de equipos. Los datos provienen de la planilla **EQUIPOS.xlsx** (dos hojas):

- **Hoja "Equipos" — 33 equipos genéricos (EQ-GEN-01 a EQ-GEN-33):**
  Catálogo general de maquinaria de construcción (excavadoras, retroexcavadoras, topadoras, motoniveladoras, compactadoras, grúas, hormigoneras, vibradores, camiones, etc.). Los costos están calculados con el **dólar a $1.390**.

- **Hoja "equipo" — 27 equipos del proyecto (EQ-PRY-01 a EQ-PRY-27):**
  Equipamiento específico utilizado en los proyectos de la organización (IVECO, Toyota Hilux, New Holland, John Deere, etc.). Los costos están calculados con el **dólar a $1.450**.

### Características del script

- **Upsert por clave compuesta `(organizationId, code)`:** Si el registro ya existe, actualiza el precio; si no existe, lo crea. Es seguro ejecutarlo múltiples veces.
- **Idempotente:** No genera duplicados ni errores si los registros ya existen.
- **No afecta otros datos:** Solo modifica las tablas `LaborCategory` y `EquipmentCatalogItem`. No toca proyectos, APUs existentes ni ningún otro dato.

### Cuándo ejecutar este script directamente

- Al recibir nuevas tablas salariales de UOCRA (actualización periódica de MMO).
- Al actualizar el valor del dólar para el cálculo de costos de equipos.
- Al incorporar nuevos equipos al catálogo de la organización.
- Como alternativa liviana a `db-sync.sh` cuando solo se necesita actualizar precios.

---

## `scripts/export-project.sh` — Exportar proyecto

Empaqueta el proyecto completo en un archivo `.zip` sin historial Git ni dependencias. Útil para transferir el proyecto a otra máquina o compartirlo.

```bash
./scripts/export-project.sh                          # Nombre automático con fecha
./scripts/export-project.sh construccion-app-v2      # Nombre personalizado
```

Excluye automáticamente: `.git`, `node_modules`, `.next`, `dist`, `backups`, `.env`, archivos de log y artefactos de build. El ZIP resultante se crea en el directorio padre del proyecto.

En la máquina destino:

```bash
unzip construccion-app-FECHA.zip
cd construccion-app-FECHA
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Editar los .env con los valores correctos
./setup.sh   # Levanta todo con Docker
```

---

## Backup y restore

La gestión de backups se realiza **desde la interfaz web**, en **Configuración → Backups** (solo visible para el rol ADMIN).

Desde esa pantalla se puede:

- **Crear un backup** — genera un dump de PostgreSQL en formato custom (`pg_dump -Fc`) y lo almacena en el volumen Docker `backups_data`.
- **Descargar** — descarga el archivo `.dump` al equipo local.
- **Restaurar** — reemplaza todos los datos de la base con los del backup seleccionado (`pg_restore --clean --if-exists`). Requiere confirmación explícita.
- **Eliminar** — borra el archivo de backup del servidor.

Los backups se almacenan en el volumen Docker `backups_data` (montado en `/app/backups` dentro del contenedor API). Para acceder directamente al directorio desde el host:

```bash
docker volume inspect construccion_backups_data
```

---

## `scripts/docker-entrypoint-api.sh` — Entrypoint del contenedor API

Script interno ejecutado automáticamente al iniciar el contenedor de la API. **No debe ejecutarse manualmente.**

Realiza tres pasos en orden:

1. Espera a que PostgreSQL esté disponible (TCP check).
2. Aplica el schema con `prisma db push`.
3. Ejecuta el seed si la base está vacía (controlado por la variable `RUN_SEED`).

| Valor de `RUN_SEED` | Comportamiento |
|---------------------|----------------|
| `true` (default) | Seed solo si la base está vacía |
| `false` | No ejecuta seed |
| `force` | Siempre ejecuta seed (borra y recrea datos) |
