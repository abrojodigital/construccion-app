# Backup y Restore de Base de Datos

Herramienta para crear y restaurar backups de PostgreSQL sin perder datos al implementar cambios.

---

## Requisitos

- Docker corriendo con el contenedor `construccion-db` activo
- Bash (incluido en macOS y Linux)

---

## Comandos rápidos

```bash
# Con el script directamente
./scripts/db-backup.sh backup
./scripts/db-backup.sh list
./scripts/db-backup.sh restore

# Con pnpm
pnpm db:backup
pnpm db:backup:list
pnpm db:restore
```

---

## Referencia de comandos

### `backup [nombre]`

Crea un backup de la base de datos actual.

```bash
# Nombre automático con timestamp (ej: construccion_db_20260309_143022.dump)
./scripts/db-backup.sh backup

# Nombre personalizado (ej: antes-de-migracion_20260309_143022.dump)
./scripts/db-backup.sh backup antes-de-migracion
```

### `list`

Muestra todos los backups disponibles con su tamaño, ordenados del más reciente al más antiguo.

```bash
./scripts/db-backup.sh list
```

Salida ejemplo:
```
  N°    Nombre                                              Tamaño
  ----  --------------------------------------------------  --------
  [1]   antes-de-migracion_20260309_150000                  212K
  [2]   estado-inicial_20260309_143022                      198K
```

### `restore [nombre]`

Restaura la base de datos desde un backup. Si no se especifica nombre, muestra la lista para elegir interactivamente.

> **Importante:** antes de restaurar se crea un backup de seguridad automático del estado actual, por si necesitás revertir.

```bash
# Interactivo: muestra la lista y pedí un número
./scripts/db-backup.sh restore

# Directo: pasá el nombre del backup (sin .dump)
./scripts/db-backup.sh restore antes-de-migracion_20260309_150000
```

### `delete [nombre]`

Elimina un backup. Si no se especifica nombre, muestra la lista para elegir interactivamente.

```bash
./scripts/db-backup.sh delete
./scripts/db-backup.sh delete estado-inicial_20260309_143022
```

---

## Flujo recomendado para implementar cambios

Este es el flujo para modificar el schema, los datos o cualquier parte del sistema sin riesgo de pérdida:

```
1. Crear backup antes de tocar nada
2. Implementar los cambios
3. Verificar que todo funciona
4. Si algo salió mal → restaurar el backup
```

### Paso a paso

**1. Crear backup antes de empezar**

```bash
./scripts/db-backup.sh backup antes-de-[descripcion]
# Ejemplo:
./scripts/db-backup.sh backup antes-de-agregar-modulo-pagos
```

**2. Aplicar los cambios** (schema, seed, migraciones, etc.)

```bash
pnpm db:push        # sincronizar schema con la BD
pnpm db:seed        # recargar datos de demo
# o lo que corresponda según el cambio
```

**3. Si todo funciona bien** → podés eliminar el backup o conservarlo

```bash
./scripts/db-backup.sh list    # ver los backups
./scripts/db-backup.sh delete  # eliminar el que ya no necesitás
```

**4. Si algo salió mal** → restaurar

```bash
./scripts/db-backup.sh restore
# Seleccioná el backup de "antes-de-..." de la lista
# Escribí "si" para confirmar
```

---

## Dónde se guardan los backups

Los archivos se guardan en la carpeta `backups/` en la raíz del proyecto:

```
construccion-app/
└── backups/
    ├── antes-de-migracion_20260309_150000.dump
    ├── estado-inicial_20260309_143022.dump
    └── pre-restore_20260309_160000.dump   ← creado automáticamente al restaurar
```

- La carpeta `backups/` está en `.gitignore`, los dumps **no se suben al repositorio**
- Los archivos `pre-restore_*.dump` son backups de seguridad creados automáticamente antes de cada restore

---

## Detalles técnicos

- Formato: `pg_dump -Fc` (binario comprimido de PostgreSQL)
- Restauración: `pg_restore --clean --if-exists` (reemplaza objetos existentes)
- Al restaurar se terminan las conexiones activas a la BD para evitar bloqueos
- Compatible con bash 3.2+ (macOS nativo)
