# Sistema de Gestión de Construcción

Sistema ERP integral para la gestión de obras de construcción, desarrollado para el mercado argentino. Cubre el ciclo completo de una obra: proyectos, cronograma Gantt, presupuesto versionado con coeficiente K, certificaciones, subcontrataciones, gastos, personal, materiales y redeterminación de precios.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 20 · Express 4.18 · TypeScript |
| Base de datos | PostgreSQL 16 · Prisma ORM 5 (51 modelos) |
| Frontend | Next.js 14 (App Router) · TypeScript (48 páginas) |
| Estilos | Tailwind CSS · Radix UI · shadcn/ui |
| Estado | Zustand (auth) · TanStack Query (servidor) |
| Validación | Zod · 64 schemas compartidos frontend/backend |
| Gráficos | Recharts |
| Autenticación | JWT + Refresh Tokens · RBAC 5 roles |
| Infraestructura | Docker · Docker Compose · Nginx |
| Monorepo | Turborepo · pnpm workspaces |

---

## Instalación rápida (Docker)

> Requisito único: **Docker Desktop** instalado y corriendo.

```bash
git clone https://github.com/abrojodigital/construccion-app.git
cd construccion-app
./setup.sh
```

El script construye las imágenes, levanta los servicios, ejecuta migraciones y carga datos de demo.
Tiempo estimado: **3–8 minutos** la primera vez.

| Servicio | URL |
|----------|-----|
| Aplicación web | http://localhost:3000 |
| API REST | http://localhost:3001/api/v1 |

### Credenciales de demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@constructorademo.com.ar | password123 |
| Jefe de Obra | jefe@constructorademo.com.ar | password123 |
| Supervisor | supervisor@constructorademo.com.ar | password123 |
| Administrativo | admin2@constructorademo.com.ar | password123 |
| Solo Lectura | lector@constructorademo.com.ar | password123 |

---

## Instalación para desarrollo local

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Editar DATABASE_URL en apps/api/.env
pnpm db:push
pnpm db:seed
pnpm dev
```

Ver [TUTORIAL_INSTALACION.md](./TUTORIAL_INSTALACION.md) para instrucciones completas.

---

## Estructura del proyecto

```
construccion-app/
├── apps/
│   ├── api/          # Express REST API — 18 módulos
│   └── web/          # Next.js 14 App Router — 48 páginas
├── packages/
│   ├── database/     # Schema Prisma (51 modelos) + seed (2.300 LOC)
│   ├── shared/       # Tipos TS + validadores Zod + constantes
│   └── typescript-config/
├── docker-compose.yml
├── setup.sh
└── turbo.json
```

---

## Módulos ERP

| Módulo | Descripción |
|--------|-------------|
| Proyectos | Obras con KPIs, cronograma y seguimiento |
| Rubros y Tareas | Jerarquía 3 niveles: Rubro → Tarea → Ítem |
| Diagrama Gantt | Vista por Rubros / Tareas / Ítems con exportación PDF |
| Presupuesto Versionado | Versiones con coeficiente K (GG · Beneficio · GF · IVA) |
| APU | Análisis de Precios Unitarios: materiales, mano de obra, equipos |
| Avance Físico | Seguimiento de avance por ítem presupuestado |
| Certificaciones | Certificados de obra con deducciones (Acopio, Anticipo, Fondo de Reparo) |
| Subcontrataciones | Gestión de subcontratistas con workflow propio de certificación |
| Gastos | Registro, aprobación y trazabilidad de gastos por proyecto |
| Monedas | Multi-moneda con historial de tipos de cambio |
| Redeterminación | Índices INDEC + fórmulas polinómicas de ajuste de precios |
| Proveedores | Base de datos con datos fiscales (CUIT) y bancarios (CBU) |
| Materiales | Inventario con control de stock y alertas de reposición |
| Empleados | Legajos, asistencia y asignación a proyectos |
| Reportes | Dashboard ejecutivo + reportes de costos y avance |

---

## Comandos útiles

```bash
# Desarrollo
pnpm dev              # API + Web en paralelo
pnpm build            # Build de producción
pnpm typecheck        # TypeScript estricto
pnpm lint             # ESLint

# Base de datos
pnpm db:push          # Sincronizar schema
pnpm db:seed          # Cargar datos demo
pnpm db:studio        # Prisma Studio (puerto 5555)
pnpm db:reset         # Borrar todo y recrear

# Docker
./setup.sh                              # Instalación completa
docker compose up -d                    # Levantar servicios
docker compose down                     # Detener
docker compose build api web --no-cache # Reconstruir imágenes
docker compose logs -f api              # Ver logs
```

---

## Roles y permisos (RBAC)

| Acción | ADMIN | PROJECT_MANAGER | SUPERVISOR | ADMINISTRATIVE | READ_ONLY |
|--------|:-----:|:---------------:|:----------:|:--------------:|:---------:|
| Gestionar proyectos | ✓ | ✓ | — | — | — |
| Rubros, tareas e ítems | ✓ | ✓ | ✓ | — | — |
| Registrar gastos | ✓ | ✓ | ✓ | ✓ | — |
| Aprobar gastos | ✓ | ✓ | — | — | — |
| Presupuestos / APU | ✓ | ✓ | — | ✓ | — |
| Certificaciones | ✓ | ✓ | — | ✓ | — |
| Gestionar empleados | ✓ | ✓ | — | ✓ | — |
| Gestionar usuarios | ✓ | — | — | — | — |
| Consulta (solo lectura) | ✓ | ✓ | ✓ | ✓ | ✓ |

---

Ver [TUTORIAL_INSTALACION.md](./TUTORIAL_INSTALACION.md) · [MANUAL_DE_USO.md](./MANUAL_DE_USO.md)
