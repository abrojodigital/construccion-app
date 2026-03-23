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

**Paso 4 — Actualización de catálogos (NUEVO)**

Siempre se ejecuta, independientemente de si la base tiene datos o no. Hace un upsert de los registros de catálogo del sistema:

- **4 categorías laborales (LaborCategory):** OF-ESP, OF, MO, AY con las tarifas horarias MMO de Febrero 2026 ($6.071/h, $5.196/h, $4.793/h, $4.438/h respectivamente).
- **65 equipos del catálogo (EquipmentCatalogItem):**
  - 33 equipos genéricos (EQ-GEN-01 a EQ-GEN-33), cotizados con dólar a $1.390.
  - 27 equipos del proyecto (EQ-PRY-01 a EQ-PRY-27), cotizados con dólar a $1.450.

Esta operación es **idempotente**: puede ejecutarse múltiples veces sin duplicar registros. Usa upsert por código de ítem, por lo que actualiza los precios si ya existen y los crea si son nuevos.

**Paso 5 — Seed de datos de demo**

Solo se ejecuta si la base de datos está vacía (no hay organizaciones registradas) o si se usó el flag `--force-seed`. Carga la organización demo "Constructora Patagonia S.A." con proyectos, usuarios, presupuestos, APUs, certificaciones y demás datos de ejemplo.

---

## `scripts/db-backup.sh` — Backup y restore

```bash
./scripts/db-backup.sh backup                      # Backup con timestamp automático
./scripts/db-backup.sh backup nombre-descriptivo   # Backup con nombre personalizado
./scripts/db-backup.sh restore                     # Restore interactivo (lista backups)
./scripts/db-backup.sh restore nombre_timestamp    # Restore de un backup específico
./scripts/db-backup.sh list                        # Listar backups disponibles
./scripts/db-backup.sh delete                      # Eliminar un backup (interactivo)
```

Los backups se guardan en `./backups/` como archivos `.dump`. Al restaurar se crea un backup de seguridad automáticamente antes de sobrescribir.

---

## `scripts/migrate.sh` — Migraciones SQL puntuales

Aplica un archivo SQL específico sobre la base de datos existente.

```bash
./scripts/migrate.sh               # Ejecuta el SQL configurado en el script
./scripts/migrate.sh --dry-run     # Muestra el SQL sin ejecutarlo
DATABASE_URL=postgres://... ./scripts/migrate.sh   # URL explícita
```

Lee `DATABASE_URL` del `.env` raíz o de `apps/api/.env`. Si `psql` no está disponible, usa `prisma db execute`.

---

## `scripts/import-mmo-equipos.ts` — Importación de catálogos MMO y equipos

Actualiza las tarifas de mano de obra y los precios de equipos del catálogo APU a partir de las planillas fuente. Útil para actualizar los catálogos sin necesidad de ejecutar un `db-sync` completo.

```bash
# Ejecutar directamente (requiere PostgreSQL accesible)
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/construccion_db" \
  npx tsx scripts/import-mmo-equipos.ts
```

### Qué actualiza

**Categorías laborales (LaborCategory) — 4 registros:**

Actualiza las tarifas horarias de mano de obra según el Convenio Colectivo de la Construcción (UOCRA). Los datos provienen de la planilla **MMO FEB-26.xlsx**:

| Código | Categoría | Tarifa horaria (Feb-26) |
|--------|-----------|------------------------|
| OF-ESP | Oficial Especializado | $6.071/h |
| OF | Oficial | $5.196/h |
| MO | Medio Oficial | $4.793/h |
| AY | Ayudante | $4.438/h |

**Equipos del catálogo (EquipmentCatalogItem) — 65 registros:**

Actualiza los costos horarios de equipos. Los datos provienen de la planilla **EQUIPOS.xlsx** (dos hojas):

- **Hoja "Equipos" — 33 equipos genéricos (EQ-GEN-01 a EQ-GEN-33):**
  Catálogo general de maquinaria de construcción (excavadoras, retroexcavadoras, topadoras, motoniveladoras, compactadoras, grúas, hormigoneras, vibradores, camiones, etc.). Los costos están calculados con el **dólar a $1.390**.

- **Hoja "equipo" — 27 equipos del proyecto (EQ-PRY-01 a EQ-PRY-27):**
  Equipamiento específico utilizado en los proyectos de la organización. Los costos están calculados con el **dólar a $1.450**.

### Características del script

- **Upsert por código:** Usa el código del equipo/categoría como clave. Si el registro ya existe, actualiza el precio; si no existe, lo crea. Es seguro ejecutarlo múltiples veces.
- **Idempotente:** No genera duplicados ni errores si los registros ya existen.
- **No afecta otros datos:** Solo modifica las tablas `LaborCategory` y `EquipmentCatalogItem`. No toca proyectos, APUs existentes ni ningún otro dato.

### Cuándo ejecutar este script

- Al recibir nuevas tablas salariales de UOCRA (actualización periódica de MMO).
- Al actualizar el valor del dólar para el cálculo de costos de equipos.
- Al incorporar nuevos equipos al catálogo de la organización.
- Como alternativa liviana a `db-sync.sh` cuando solo se necesita actualizar precios.

### Archivos fuente

Los archivos Excel fuente que usa el script son:

- `EQUIPOS.xlsx` — Planilla de costos horarios de equipos (dos hojas: "Equipos" y "equipo").
- `MMO FEB-26.xlsx` — Planilla de tarifas de mano de obra Febrero 2026.

Estos archivos deben estar disponibles en el entorno donde se ejecuta el script (no se incluyen en el repositorio por ser documentos de trabajo internos).
