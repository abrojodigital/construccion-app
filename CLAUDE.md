# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Full monorepo
pnpm dev              # Start API (3001) + Web (3000) concurrently
pnpm build            # Build all packages via Turborepo
pnpm lint             # ESLint all packages
pnpm lint:fix         # ESLint auto-fix
pnpm typecheck        # TypeScript strict check (all packages)
pnpm format           # Prettier formatting

# Individual apps
pnpm dev:api          # Only API server (tsx watch)
pnpm dev:web          # Only Next.js frontend

# Database (runs against packages/database)
pnpm db:push          # Sync Prisma schema to DB (no migration files)
pnpm db:migrate:dev   # Create migration + apply
pnpm db:seed          # Load demo data
pnpm db:studio        # Visual DB browser (port 5555)
pnpm db:generate      # Regenerate Prisma client after schema changes
pnpm db:reset         # Drop all data + recreate

# Docker (full stack)
./setup.sh            # One-command setup: Docker build + start + seed
docker compose up -d  # Start all services
docker compose down   # Stop all services
docker compose build api web --no-cache  # Rebuild after code changes
docker compose up -d api web             # Restart with new images
```

## Architecture

Turborepo monorepo with pnpm workspaces. Four packages:

- **`apps/api`** (`@construccion/api`) — Express 4.18 REST API on port 3001
- **`apps/web`** (`@construccion/web`) — Next.js 14 App Router on port 3000
- **`packages/database`** (`@construccion/database`) — Prisma schema (57 models), client export, seed script (2300+ LOC)
- **`packages/shared`** (`@construccion/shared`) — Zod validators (64 schemas), TypeScript types, constants, utils

### Project Metrics

| Metric | Count |
|--------|-------|
| Total LOC (apps) | ~30,500 |
| Prisma Models | 57 |
| Zod Validators | 64 |
| Frontend Pages | 48 |
| Frontend Forms | 24 |
| UI Components | 17 |
| API Modules | 18 |
| Seed LOC | 2,338 |

### Backend (apps/api)

**3-layer pattern per module:** `routes.ts` → `controller.ts` → `service.ts`

Each module lives in `src/modules/{name}/` with these three files. Routes wire Express Router with middleware, controllers handle request/response, services contain business logic and Prisma queries.

**18 API Modules:**

| Module | Path | Description |
|--------|------|-------------|
| auth | `/auth` | Login, registro, refresh tokens |
| users | `/users` | Gestion de usuarios |
| projects | `/projects` | Proyectos de obra |
| stages | `/stages` | Etapas del proyecto |
| tasks | `/tasks` | Tareas por etapa |
| costs | `/costs` | Centro de costos |
| expenses | `/expenses` | Gastos |
| suppliers | `/suppliers` | Proveedores |
| materials | `/materials` | Materiales |
| employees | `/employees` | Empleados |
| budget-versions | `/projects/:id/budget-versions` | Presupuesto versionado con coeficiente K |
| price-analysis | `/budget-items/:id/price-analysis` | Analisis de Precios Unitarios (APU) |
| progress | `/budget-items/:id/progress` | Avance fisico por item |
| certificates | `/projects/:id/certificates` | Certificaciones de obra |
| subcontracts | `/projects/:id/subcontracts` | Subcontrataciones |
| currencies | `/currencies` | Monedas y tipos de cambio |
| adjustments | `/adjustments` | Redeterminacion de precios (indices, formulas, calculo) |
| reports | `/reports` | Reportes |

**Middleware chain order:** Helmet → CORS → Rate limit → Body parse (10MB) → Sanitize → per-route: Auth → RBAC → Zod validation

**RBAC system** (`src/middleware/rbac.middleware.ts`): 5 roles (ADMIN, PROJECT_MANAGER, SUPERVISOR, ADMINISTRATIVE, READ_ONLY) with a permissions matrix over 22 resources. Use `requirePermission(resource, permission)` in routes. Permissions are: read, write, delete, approve.

**Multi-tenancy:** All queries filter by `organizationId` from `req.user`. Never query without org scoping.

**Soft deletes:** Entities use `deletedAt` field. Filter with `deletedAt: null` in queries.

**Error handling:** Custom error classes in `src/shared/utils/errors.ts` (AppError, NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError). Global error middleware maps Prisma errors (P2002, P2003, P2025) automatically.

**Response format** (`src/shared/utils/response.ts`): All endpoints use `sendSuccess()`, `sendPaginated()`, `sendCreated()`, `sendError()`. Consistent shape: `{ success, data, error?, meta: { timestamp } }`.

**Auto-generated codes** (`src/shared/utils/code-generator.ts`): Entities get sequential codes like `OBR-2024-00001` (projects), `PRES-2025-00001-v1` (budget versions), `CERT-2025-00001` (certificates), `GAS-2024-00001` (expenses), `PROV-00001` (suppliers).

**Config:** `src/config/index.ts` loads from `.env` (root-level in dev, per-app in prod). API port via `PORT` or `API_PORT` env var.

### Frontend (apps/web)

**Routing:** Next.js App Router with two route groups:
- `(auth)/` — Public pages (login, register)
- `(dashboard)/` — Protected pages with sidebar layout. Auth check in layout redirects to `/login` if unauthenticated.

**48 Pages organized by module:**

| Module | Route | Pages |
|--------|-------|-------|
| Dashboard | `/dashboard` | 1 |
| Projects | `/projects`, `/projects/[id]` | 3 (list, detail, new) |
| Stages & Tasks | `/projects/[id]/stages`, `/projects/[id]/tasks/[taskId]` | 2 |
| Expenses | `/expenses`, `/expenses/[id]` | 4 (list, detail, new, edit) |
| Suppliers | `/suppliers`, `/suppliers/[id]` | 4 |
| Materials | `/materials`, `/materials/[id]` | 4 |
| Employees | `/employees`, `/employees/[id]` | 4 |
| Budget Versions | `/projects/[id]/budget-versions`, `.../[versionId]` | 2 |
| APU | `.../apu/[budgetItemId]` | 1 |
| Progress | `.../progress` | 1 |
| Certificates | `/projects/[id]/certificates`, `.../[certId]` | 2 |
| Subcontracts | `/projects/[id]/subcontracts`, `.../new`, `.../[subId]` | 3 |
| Currencies | `/currencies`, `/currencies/[id]` | 2 |
| Adjustments | `/adjustments`, `.../indices/[indexId]`, `.../formulas/[formulaId]` | 3 |
| Adjustment Formula (project) | `/projects/[id]/adjustment-formula/new` | 1 |
| Settings | `/settings`, `/settings/users` | 2 |
| Reports | `/reports` | 1 |
| Auth | `/login` | 1 |

**State management:**
- Zustand (`src/store/auth.store.ts`) for auth state (user, tokens), persisted to localStorage
- TanStack Query for server state (data fetching, caching, mutations)

**API client** (`src/lib/api.ts`): Singleton class with auto-attached Bearer token from Zustand store. Handles 401 with automatic token refresh or redirect to `/login`. Use inline generics: `api.get<Type>('/endpoint')`. No custom hooks — use `useQuery`/`useMutation` directly in page components.

**Component patterns:**
- UI primitives: 17 Radix UI components in `src/components/ui/` (button, card, dialog, select, tabs, progress, collapsible, etc.)
- Forms: 24 form components in `src/components/forms/` using React Hook Form + `@hookform/resolvers` + Zod
- Tables: TanStack Table wrapper in `src/components/tables/data-table.tsx`
- Charts: Recharts in `src/components/charts/`
- Icons: lucide-react
- CRUD child entities via Dialog pattern (chapters, items, APU components, index values)

**Path alias:** `@/*` maps to `./src/*`

### Shared Package (packages/shared)

Import subpaths:
- `@construccion/shared` or `@construccion/shared/types` — TypeScript interfaces (ApiResponse, UserPayload, ProjectStatus, etc.)
- `@construccion/shared/validators` — 64 Zod schemas for all entities + Argentine-specific validators (CUIT checksum, DNI, CBU, CUIL generation)
- `@construccion/shared/constants` — Enums, status labels/colors, budget units, labor categories, APU sections, IVA rates
- `@construccion/shared/utils` — `formatCurrency`, `formatDate`, `formatPercentage`, `formatCUIT`

Validators are shared between frontend (form validation) and backend (request validation). When adding a new entity, define the Zod schema here first.

### Database (packages/database)

Schema at `prisma/schema.prisma` (57 models, 1845 LOC).

**Core entities:** Organization → User → Project → Stage → Task

**ERP entities:**
- BudgetVersion → BudgetChapter → BudgetItem (presupuesto versionado)
- PriceAnalysis → AnalysisMaterial, AnalysisLabor, AnalysisEquipment, AnalysisTransport (APU)
- ItemProgress (avance fisico)
- Certificate → CertificateItem (certificaciones)
- Subcontract → SubcontractItem, SubcontractCertificate → SubcontractCertificateItem
- Currency, ExchangeRate (monedas)
- PriceIndex → PriceIndexValue, AdjustmentFormula → AdjustmentWeight (redeterminacion)

**Supporting entities:** Expense, Material, Supplier, Employee, PurchaseOrder, Quote, Document, Notification, AuditLog

All monetary fields use `Decimal(15,2)`. Percentage fields in BudgetVersion use `Decimal(6,4)` for values 0-1.

The seed script (`prisma/seed.ts`, 2338 LOC) creates a full demo organization "Constructora Patagonia S.A." with:
- 6 users across all RBAC roles
- 3 projects including "Red Cloacal" with real construction data
- Budget versions with chapters, items and K coefficients
- APUs with materials, labor, equipment and transport
- Physical progress records
- Certificates with deduction calculations
- Currencies (ARS, USD, EUR) with exchange rates
- Price indices with historical values
- Adjustment formulas

## ERP Modules Detail

### 1. Presupuesto Versionado (Budget Versions)
Multiple budget versions per project with coefficient K calculation: `K = (1+GG) × (1+B) × (1+GF) × (1+IVA)`. States: DRAFT → APPROVED → SUPERSEDED. Approved budgets are read-only. Each version has chapters containing items.

### 2. APU (Analisis de Precios Unitarios)
Per-item cost breakdown in 6 sections: Materials, Labor, Equipment (sections D/E/F), Transport, Indirect Costs, and total Direct Cost. Each section has a table of components with quantities and unit costs.

### 3. Avance Fisico (Physical Progress)
Track construction progress per budget item with decimal advance values (0-1). Summary views by chapter and version with calculated executed amounts.

### 4. Certificaciones (Certificates)
Periodic work certificates with item-level advance percentages. Financial calculations include deductions: Acopio, Anticipo, Fondo de Reparo, IVA. States: DRAFT → SUBMITTED → APPROVED → PAID. Draft allows inline editing of advances.

### 5. Subcontrataciones (Subcontracts)
Manage subcontractors with contractor info (CUIT, contact), item lists linkable to budget items, and independent certification workflow. States: DRAFT → ACTIVE → COMPLETED → CANCELLED.

### 6. Monedas (Currencies)
Multi-currency support with date-based exchange rate tracking (source: BCRA, etc.). Currency conversion utilities.

### 7. Redeterminacion de Precios (Price Adjustments)
Argentine construction price adjustment system. Three components:
- **Price Indices**: Historical values tracking (e.g., INDEC materials, labor indices)
- **Adjustment Formulas**: Polynomial formulas with weighted components (weights must sum to 1.0)
- **Calculator**: Compute adjustment factor between base and current dates

## Environment Variables

API needs: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`
Web needs: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api/v1`)

See `apps/api/.env.example` and `apps/web/.env.example` for full variable lists.

## Docker

Three services: `postgres` (PostgreSQL 16), `api` (Express), `web` (Next.js standalone).

The API container entrypoint (`scripts/docker-entrypoint-api.sh`):
1. Waits for PostgreSQL to be healthy
2. Runs `prisma db push` to sync schema
3. Seeds database if empty (or `RUN_SEED=force` to re-seed)
4. Starts Express server

To update Docker after code changes:
```bash
docker compose build api web --no-cache
docker compose up -d api web
```

## Conventions

- **Language:** All user-facing strings, error messages, comments, and labels are in Spanish
- **Code style:** Prettier with single quotes, trailing commas, 100 char width, 2-space indent
- **Currency:** Argentine Pesos (ARS), Decimal(15,2) for all money fields
- **Percentages:** Stored as decimals 0-1 (e.g., 0.21 for 21% IVA). Validated with `max(1)` in Zod schemas.
- **Argentine document types:** CUIT (company), CUIL (employee), DNI (personal), CBU (bank account) — all have checksum validators in shared package
- **Invoice types:** A, B, C (Argentine fiscal classifications)
- **No custom hooks**: Use `useQuery`/`useMutation` directly in page components
- **No typed API methods**: Use inline generics `api.get<Type>('/endpoint')`
- **Child entity CRUD**: Use Dialog pattern (not separate pages)
- **TypeScript interfaces**: Defined in each page file (following existing pattern)

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@constructorademo.com.ar | password123 | ADMIN |
| jefe@constructorademo.com.ar | password123 | PROJECT_MANAGER |
| supervisor@constructorademo.com.ar | password123 | SUPERVISOR |
| admin2@constructorademo.com.ar | password123 | ADMINISTRATIVE |
| lector@constructorademo.com.ar | password123 | READ_ONLY |
