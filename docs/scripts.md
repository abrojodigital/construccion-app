# Scripts de administración

## `setup.sh` — Instalación inicial

Levanta todo el stack por primera vez (Docker build + start + seed).

```bash
./setup.sh
```

Prerequisitos: Docker instalado y corriendo, puertos 3000, 3001 y 5432 libres.

---

## `scripts/db-sync.sh` — Sincronización de base de datos

Sincroniza el esquema Prisma con PostgreSQL. Útil al llevar el proyecto a una nueva máquina o luego de un `git pull` con cambios en el schema.

```bash
./scripts/db-sync.sh               # Sync + seed automático si la BD está vacía
./scripts/db-sync.sh --no-seed     # Solo sincroniza esquema, no toca datos
./scripts/db-sync.sh --force-seed  # Sync + re-seed completo (reemplaza datos)
./scripts/db-sync.sh --dry-run     # Muestra qué haría sin ejecutar nada
```

El script levanta el contenedor de PostgreSQL si no está corriendo y elige automáticamente cómo ejecutar Prisma (contenedor API, `docker compose run`, o `npx` local).

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
