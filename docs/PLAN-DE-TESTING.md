# Plan de Testing — Sistema de Gestión de Construcción

## Estado actual

El sistema no tiene ningún test implementado. Este documento define la estrategia completa
para establecer una cobertura de testing desde cero.

---

## 1. Estrategia general

### Pirámide de testing

```
         /\
        /E2E\          ← 10%  Flujos críticos de usuario (Playwright)
       /------\
      /Integra-\       ← 40%  API endpoints (Supertest + Jest)
     /  ción    \
    /------------\
   /  Unitarios   \    ← 50%  Validators, lógica financiera, utils (Vitest)
  /________________\
```

### Cobertura objetivo

| Capa | Objetivo |
|------|----------|
| Paquete `shared` (validators, utils) | 95% |
| API — lógica de negocio (services) | 80% |
| API — endpoints (integration) | 75% |
| Frontend — componentes críticos | 60% |
| E2E — flujos críticos | 15 escenarios cubiertos |

### Convenciones

- Idioma de código y comentarios de tests: **inglés** (convención técnica)
- Mensajes de error y datos de test: **español** (como el sistema)
- Un archivo de test por módulo: `nombre.test.ts` junto al archivo fuente
- Tests de integración en `src/__tests__/` de cada app
- Base de datos de test: PostgreSQL separada via variable `DATABASE_URL_TEST`

---

## 2. Herramientas seleccionadas

### Backend (apps/api)

| Herramienta | Uso | Razón |
|-------------|-----|-------|
| **Vitest** | Test runner + assertions | Compatible con TS nativo, más rápido que Jest en ESM |
| **Supertest** | HTTP integration tests | Estándar para Express |
| **@faker-js/faker** | Datos de prueba | Genera datos realistas |
| **prisma-mock** | Mock de Prisma client | Aísla tests unitarios de BD |

### Frontend (apps/web)

| Herramienta | Uso |
|-------------|-----|
| **Vitest + jsdom** | Unit tests de componentes |
| **React Testing Library** | Testing de componentes React |
| **MSW (Mock Service Worker)** | Mock de llamadas API |

### E2E

| Herramienta | Uso |
|-------------|-----|
| **Playwright** | Tests end-to-end multi-browser |

### Paquete shared

| Herramienta | Uso |
|-------------|-----|
| **Vitest** | Tests unitarios de validators y utils |

---

## 3. Instalación y configuración

### 3.1. Dependencias por paquete

```bash
# packages/shared
pnpm --filter @construccion/shared add -D vitest

# apps/api
pnpm --filter @construccion/api add -D vitest supertest @types/supertest @faker-js/faker

# apps/web
pnpm --filter @construccion/web add -D vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom msw

# E2E (raíz del monorepo)
pnpm add -D @playwright/test
npx playwright install chromium
```

### 3.2. Configuración de Vitest (apps/api)

`apps/api/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/main.ts', 'src/config/**', '**/*.routes.ts'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
});
```

### 3.3. Variables de entorno para testing

`apps/api/.env.test`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/construccion_test"
JWT_SECRET="test-jwt-secret-32-chars-minimum!!"
JWT_REFRESH_SECRET="test-refresh-secret-32-chars-min!!"
NODE_ENV="test"
PORT=3002
```

### 3.4. Scripts en package.json

```json
// apps/api/package.json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:integration": "vitest run src/__tests__/integration"
}
```

```json
// raíz
"scripts": {
  "test": "turbo test",
  "test:e2e": "playwright test",
  "test:coverage": "turbo test:coverage"
}
```

---

## 4. Tests unitarios — Paquete `shared`

### Prioridad: ALTA (son la base de validación de todo el sistema)

### 4.1. Validators argentinos

**Archivo**: `packages/shared/src/validators/argentine.test.ts`

```
Casos a cubrir:
  CUIT
    ✓ CUIT válido con dígito verificador correcto
    ✓ CUIT con prefijo de empresa (30, 33)
    ✓ CUIT con prefijo de persona física (20, 23, 24, 27)
    ✗ CUIT con dígito verificador incorrecto
    ✗ CUIT con longitud incorrecta
    ✗ CUIT con caracteres no numéricos

  CBU
    ✓ CBU válido de 22 dígitos
    ✗ CBU con dígito de bloque incorrecto
    ✗ CBU con longitud incorrecta

  DNI
    ✓ DNI de 7 dígitos
    ✓ DNI de 8 dígitos
    ✗ DNI con menos de 7 dígitos
    ✗ DNI con caracteres no numéricos
```

### 4.2. Validators de entidades (Zod schemas)

**Archivo**: `packages/shared/src/validators/entities.test.ts`

```
Casos a cubrir por schema:

  CreateProjectSchema
    ✓ Proyecto válido con todos los campos requeridos
    ✓ Proyecto sin campos opcionales
    ✗ Sin nombre
    ✗ Fecha de inicio posterior a fecha de fin
    ✗ Presupuesto negativo

  BudgetVersionSchema (coeficiente K)
    ✓ K calculado correctamente: (1+GG)*(1+B)*(1+GF)*(1+IVA)
    ✓ GG = 0.15, B = 0.05, GF = 0.03, IVA = 0.21 → K ≈ 1.50
    ✗ Porcentaje > 1 (max es 1 = 100%)
    ✗ Porcentaje negativo

  CertificateSchema
    ✓ Certificado con avances entre 0 y 1
    ✗ Avance > 1
    ✗ Avance negativo

  AdjustmentFormulaSchema
    ✓ Pesos que suman exactamente 1.0
    ✗ Pesos que suman ≠ 1.0 (por ejemplo 0.95)

  PriceIndexValueSchema
    ✓ Valor positivo con fecha válida
    ✗ Valor negativo o cero
```

### 4.3. Utils de formateo

**Archivo**: `packages/shared/src/utils/format.test.ts`

```
  formatCurrency
    ✓ Formatea ARS con separadores de miles correctos
    ✓ Maneja valores negativos
    ✓ Maneja cero

  formatPercentage
    ✓ 0.21 → "21%"
    ✓ 0.5 → "50%"

  formatDate
    ✓ ISO string → formato local (dd/mm/aaaa)
```

---

## 5. Tests unitarios — Services de API

### Prioridad: ALTA para lógica financiera, MEDIA para CRUD simple

### 5.1. Setup de base

**Archivo**: `apps/api/src/__tests__/setup.ts`

```typescript
import { vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient } from '@construccion/database';

// Mock global de Prisma
vi.mock('@construccion/database', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

// Reset mocks entre tests
beforeEach(() => {
  mockReset(prismaMock);
});
```

### 5.2. AuthService

**Archivo**: `apps/api/src/modules/auth/__tests__/auth.service.test.ts`

```
Casos a cubrir:

  login()
    ✓ Credenciales correctas → retorna accessToken + refreshToken
    ✓ Los tokens tienen la estructura JWT esperada
    ✗ Email no existe → lanza UnauthorizedError
    ✗ Password incorrecto → lanza UnauthorizedError (mismo mensaje que email inexistente)
    ✗ Usuario de otra organización no puede loguearse con datos propios

  refreshToken()
    ✓ Refresh token válido → nuevo accessToken
    ✗ Refresh token expirado → lanza UnauthorizedError
    ✗ Refresh token revocado → lanza UnauthorizedError
    ✗ Refresh token con firma incorrecta → lanza UnauthorizedError

  register()
    ✓ Crea usuario con password hasheado (bcrypt)
    ✓ Password nunca se guarda en texto plano
    ✗ Email duplicado en misma organización → lanza ConflictError
```

### 5.3. BudgetVersionService — Coeficiente K

**Archivo**: `apps/api/src/modules/budget-versions/__tests__/budget-versions.service.test.ts`

```
Casos a cubrir:

  calculateK()
    ✓ K = (1 + GG) × (1 + B) × (1 + GF) × (1 + IVA)
    ✓ Con GG=0.20, B=0.07, GF=0.05, IVA=0.21 → K = 1.6453...
    ✓ K mínimo con todos los coeficientes en 0 = 1.0
    ✓ Precisión decimal (Decimal.js o similar)

  approveBudgetVersion()
    ✓ Estado DRAFT → APPROVED
    ✗ Versión ya APPROVED → lanza ConflictError (solo lectura)
    ✗ No encontrada → lanza NotFoundError
    ✓ Al aprobar, otras versiones APPROVED del mismo proyecto pasan a SUPERSEDED

  create()
    ✓ Código generado con formato PRES-YYYY-NNNNN-v1
    ✓ Versión 2 del mismo proyecto genera PRES-YYYY-NNNNN-v2
```

### 5.4. CertificateService — Cálculos financieros

**Archivo**: `apps/api/src/modules/certificates/__tests__/certificates.service.test.ts`

```
Casos a cubrir:

  calculateDeductions()
    ✓ Deducción correcta de Acopio: monto_certificado × porcentaje_acopio
    ✓ Deducción correcta de Anticipo
    ✓ Deducción correcta de Fondo de Reparo
    ✓ IVA aplicado correctamente (21%)
    ✓ Monto neto = bruto - suma(deducciones)
    ✓ Valores con múltiples decimales mantienen precisión

  approve()
    ✓ Estado SUBMITTED → APPROVED
    ✗ Estado DRAFT → no puede aprobarse directamente
    ✗ Estado PAID → no puede modificarse

  generateHtml()  [SEGURIDAD - ver vulnerabilidad reportada]
    ✓ Nombre de proyecto con caracteres HTML (<, >, &, ") es escapado
    ✓ Descripción de ítem con <script> es escapado
    ✓ El HTML resultante no contiene etiquetas <script> inyectadas
```

### 5.5. AdjustmentsService — Redeterminación de precios

**Archivo**: `apps/api/src/modules/adjustments/__tests__/adjustments.service.test.ts`

```
Casos a cubrir:

  calculateAdjustmentFactor()
    ✓ Factor = Σ(peso_i × índice_actual_i / índice_base_i)
    ✓ Con un solo componente de peso 1.0: factor = índice_actual / índice_base
    ✓ Con múltiples componentes: promedio ponderado correcto
    ✓ Índices con fecha exacta de base y fecha actual
    ✗ Falta valor de índice para la fecha base → lanza ValidationError
    ✗ Falta valor de índice para la fecha actual → lanza ValidationError
    ✗ Pesos de fórmula no suman 1.0 → lanza ValidationError
```

### 5.6. RBAC Middleware

**Archivo**: `apps/api/src/middleware/__tests__/rbac.middleware.test.ts`

```
Casos a cubrir:

  requirePermission('projects', 'write')
    ✓ ADMIN puede escribir proyectos
    ✓ PROJECT_MANAGER puede escribir proyectos
    ✗ SUPERVISOR no puede escribir proyectos → 403
    ✗ READ_ONLY no puede escribir proyectos → 403

  requirePermission('reports', 'read')
    ✓ Todos los roles pueden leer reportes
    ✗ Sin token → 401

  requirePermission('users', 'delete')
    ✓ Solo ADMIN puede eliminar usuarios
    ✗ PROJECT_MANAGER no puede eliminar usuarios → 403

  Multi-tenancy
    ✓ Usuario de org A no puede acceder a datos de org B (aunque tenga permiso del recurso)
```

---

## 6. Tests de integración — API endpoints

### Prioridad: ALTA para flujos de autenticación y datos financieros

### 6.1. Setup de integración

```typescript
// apps/api/src/__tests__/integration/setup.ts
import { app } from '../../app';
import { prisma } from '@construccion/database';

// Helpers de factory para crear datos de test
export const createTestOrg = async () => { ... };
export const createTestUser = async (orgId: string, role: Role) => { ... };
export const getAuthToken = async (email: string, password: string) => { ... };

// Limpiar BD entre tests
beforeEach(async () => {
  await prisma.$transaction([
    prisma.certificateItem.deleteMany(),
    prisma.certificate.deleteMany(),
    // ... orden respetando foreign keys
    prisma.organization.deleteMany(),
  ]);
});
```

### 6.2. Auth endpoints

**Archivo**: `apps/api/src/__tests__/integration/auth.test.ts`

```
POST /api/v1/auth/login
  ✓ 200 con credenciales correctas → { accessToken, refreshToken, user }
  ✗ 401 con password incorrecto
  ✗ 401 con email inexistente
  ✗ 400 con body vacío (Zod validation)
  ✗ 400 con email inválido

POST /api/v1/auth/refresh
  ✓ 200 con refresh token válido
  ✗ 401 con refresh token expirado
  ✗ 401 sin Authorization header

POST /api/v1/auth/logout
  ✓ 200 invalida el refresh token
  ✓ Refresh token ya no puede usarse después del logout
```

### 6.3. Projects endpoints

**Archivo**: `apps/api/src/__tests__/integration/projects.test.ts`

```
GET /api/v1/projects
  ✓ 200 lista solo proyectos de la organización del usuario
  ✓ Paginación funciona (page, limit)
  ✓ Filtro por status funciona
  ✗ 401 sin token
  ✓ Soft-deleted no aparecen en listado

POST /api/v1/projects
  ✓ 201 crea proyecto y retorna con código auto-generado (OBR-YYYY-NNNNN)
  ✗ 403 con rol READ_ONLY
  ✗ 400 con datos inválidos (Zod)

DELETE /api/v1/projects/:id
  ✓ Soft-delete (deletedAt se setea, no elimina físicamente)
  ✗ 404 para ID inexistente
  ✗ 403 rol SUPERVISOR no puede eliminar
  ✗ 403 no puede eliminar proyecto de otra organización (IDOR)
```

### 6.4. Multi-tenancy — Tests de aislamiento

**Archivo**: `apps/api/src/__tests__/integration/multitenancy.test.ts`

```
IDOR - Aislamiento entre organizaciones
  ✓ Usuario org A no puede ver proyectos de org B
  ✓ Usuario org A no puede ver empleados de org B
  ✗ GET /employees/:id/projects con ID de otra org → 404 (no 200)  [BUG ACTUAL]
  ✓ Usuario org A no puede modificar datos de org B
  ✓ Reportes solo incluyen datos de la propia organización

Todos los recursos críticos:
  Projects, Stages, Tasks, Employees, Expenses,
  BudgetVersions, Certificates, Subcontracts
```

### 6.5. Employees — Fix del bug IDOR reportado

**Archivo**: `apps/api/src/__tests__/integration/employees.test.ts`

```
GET /api/v1/employees/:id/projects
  ✓ 200 retorna proyectos de empleado de la misma org
  ✗ 404 al consultar empleado de otra organización  [actualmente retorna 200 - BUG]

GET /api/v1/employees/:id/attendance
  ✓ 200 retorna asistencia de empleado de la misma org
  ✗ 404 al consultar empleado de otra organización  [verificar mismo bug]
```

---

## 7. Tests de componentes — Frontend

### Prioridad: MEDIA (formularios críticos y flujo de autenticación)

### 7.1. Formularios financieros

**Archivo**: `apps/web/src/components/forms/__tests__/budget-version-form.test.tsx`

```
BudgetVersionForm
  ✓ Muestra todos los campos (GG, B, GF, IVA)
  ✓ Validación: muestra error cuando porcentaje > 100%
  ✓ Muestra preview del coeficiente K calculado en tiempo real
  ✓ Submit envía los valores correctos a la API
  ✓ Campos deshabilitados cuando versión está APPROVED

CertificateForm
  ✓ Avance por ítem entre 0% y 100%
  ✓ Muestra monto calculado según avance ingresado
  ✓ Resumen de deducciones visible antes de confirmar
```

### 7.2. Autenticación

**Archivo**: `apps/web/src/app/(auth)/login/__tests__/page.test.tsx`

```
LoginPage
  ✓ Renderiza formulario email + password
  ✓ Muestra error de validación con email inválido
  ✓ Llama a la API con credenciales correctas
  ✓ Redirige a /dashboard tras login exitoso
  ✓ Muestra mensaje de error con credenciales incorrectas
  ✓ Botón deshabilitado durante loading
```

### 7.3. Sidebar y navegación

**Archivo**: `apps/web/src/components/layouts/__tests__/sidebar.test.tsx`

```
Sidebar
  ✓ Muestra solo items de menú accesibles según el rol
  ✓ ADMIN ve todos los items
  ✓ READ_ONLY no ve botones de creación
  ✓ Link activo resaltado según ruta actual
```

---

## 8. Tests E2E — Flujos críticos

### Prioridad: ALTA para los 5 flujos de negocio principales

### Configuración de Playwright

`playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  baseURL: 'http://localhost:3000',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Flujo 1: Ciclo completo de proyecto

**Archivo**: `e2e/project-lifecycle.spec.ts`

```
Scenario: Crear y gestionar un proyecto completo
  1. Login como PROJECT_MANAGER
  2. Crear proyecto "Obras Viales Test 2025"
  3. Verificar código generado automáticamente (OBR-2025-NNNNN)
  4. Crear etapa "Movimiento de Suelos"
  5. Agregar tarea a la etapa
  6. Verificar que aparece en dashboard
  7. Cambiar estado a EN_PROGRESO
  8. Verificar que estado se refleja en listado
```

### Flujo 2: Presupuesto y APU

**Archivo**: `e2e/budget-apu.spec.ts`

```
Scenario: Crear versión de presupuesto con APU
  1. Login como PROJECT_MANAGER
  2. Ir a proyecto existente → Presupuestos
  3. Crear nueva versión de presupuesto
  4. Ingresar coeficientes K (GG, B, GF, IVA)
  5. Verificar cálculo automático de K en pantalla
  6. Agregar capítulo y ítem de presupuesto
  7. Crear APU del ítem: agregar materiales, mano de obra
  8. Verificar que el total del APU se refleja en el ítem
  9. Aprobar la versión de presupuesto
  10. Verificar que la versión queda en solo-lectura
```

### Flujo 3: Certificación de obra

**Archivo**: `e2e/certificate.spec.ts`

```
Scenario: Emitir certificado de avance
  1. Login como PROJECT_MANAGER (proyecto con presupuesto APPROVED)
  2. Ir a Certificados → Nuevo
  3. Ingresar avances por ítem (ej: 30%, 50%)
  4. Verificar monto bruto calculado
  5. Ingresar deducciones (Fondo de Reparo 5%)
  6. Verificar monto neto
  7. Guardar como DRAFT
  8. Enviar para aprobación (SUBMITTED)
  9. Login como ADMIN → aprobar certificado
  10. Exportar HTML del certificado
  11. Verificar que el HTML no contiene scripts inyectados  [test de seguridad]
```

### Flujo 4: Redeterminación de precios

**Archivo**: `e2e/price-adjustment.spec.ts`

```
Scenario: Calcular ajuste de precios
  1. Login como ADMINISTRATIVE
  2. Ir a Redeterminación → Índices
  3. Crear índice "INDEC Materiales" con valor base en Enero 2024
  4. Agregar valor actual en Diciembre 2024
  5. Crear fórmula de ajuste (peso materiales 0.6, peso mano de obra 0.4)
  6. Verificar que los pesos suman 1.0
  7. Ir a Calculadora → seleccionar fórmula, fecha base, fecha actual
  8. Verificar factor de ajuste calculado
```

### Flujo 5: Control de acceso por roles

**Archivo**: `e2e/rbac.spec.ts`

```
Scenario: READ_ONLY no puede crear datos
  1. Login como READ_ONLY (lector@constructorademo.com.ar)
  2. Verificar que botón "Nuevo Proyecto" no existe o está deshabilitado
  3. Intentar acceder directamente a /projects/new → redirigir o mostrar error
  4. Verificar que puede VER proyectos (GET funciona)
  5. Verificar que no puede modificar ningún dato

Scenario: SUPERVISOR solo accede a su proyecto
  1. Login como SUPERVISOR
  2. Verificar sidebar sin acceso a módulos financieros
  3. Puede ver etapas y tareas
  4. No puede aprobar certificados
```

---

## 9. Tests de seguridad

### 9.1. XSS en exportaciones HTML (vulnerabilidad confirmada)

**Archivo**: `apps/api/src/modules/reports/__tests__/xss-prevention.test.ts`

```typescript
describe('XSS Prevention in HTML exports', () => {
  it('should escape project names in report HTML', async () => {
    const maliciousName = '<script>alert("XSS")</script>';
    // Crear proyecto con nombre malicioso, generar reporte
    // Verificar que el HTML resultante contiene &lt;script&gt; no <script>
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should escape item descriptions in certificate HTML', async () => {
    const maliciousDesc = '"><img src=x onerror="fetch(attacker)">';
    // Similar a arriba para certificados
  });
});
```

### 9.2. JWT con secretos por defecto

```
Test: aplicación no inicia en producción sin JWT_SECRET
  ✓ NODE_ENV=production sin JWT_SECRET → process.exit(1) o throw en startup
  ✓ NODE_ENV=development con fallback → warning en consola (al menos)
```

### 9.3. IDOR — Employee endpoints

```
Test: aislamiento de organización en /employees/:id/projects
  ✓ Org A no puede ver proyectos de empleado de Org B
  ✓ Response es 404, no 200 con datos vacíos  [evitar oracle de enumeración]
```

---

## 10. Plan de implementación por fases

### Fase 1 — Fundamentos (Sprint 1, ~1 semana)

Objetivo: Infraestructura de testing funcionando, bugs de seguridad cubiertos.

| Tarea | Prioridad | Archivo |
|-------|-----------|---------|
| Instalar Vitest en todos los paquetes | CRÍTICA | package.json |
| Setup de base de datos de test | CRÍTICA | .env.test |
| Tests de validators argentinos | ALTA | shared/validators.test.ts |
| Test RBAC middleware (cobertura de roles) | ALTA | rbac.middleware.test.ts |
| Test IDOR employees (fix del bug) | ALTA | employees.test.ts |
| Test XSS en HTML exports | ALTA | xss-prevention.test.ts |
| GitHub Actions básico (run tests en PR) | ALTA | .github/workflows/ci.yml |

### Fase 2 — Lógica financiera (Sprint 2, ~1 semana)

Objetivo: Cubrir toda la lógica de negocio crítica.

| Tarea | Prioridad | Archivo |
|-------|-----------|---------|
| Tests de cálculo coeficiente K | ALTA | budget-versions.service.test.ts |
| Tests de deducciones en certificados | ALTA | certificates.service.test.ts |
| Tests de cálculo de redeterminación | ALTA | adjustments.service.test.ts |
| Tests de integración auth endpoints | ALTA | auth.test.ts |
| Tests de integración projects (IDOR) | ALTA | multitenancy.test.ts |
| Tests de cobertura shared/utils | MEDIA | format.test.ts |

### Fase 3 — Cobertura completa API (Sprint 3, ~1 semana)

Objetivo: 75% cobertura en endpoints de API.

| Tarea | Prioridad |
|-------|-----------|
| Integration tests todos los módulos | MEDIA |
| Tests de paginación y filtros | MEDIA |
| Tests de soft-delete en todos los recursos | MEDIA |
| Tests de validación Zod (400 responses) | MEDIA |
| Tests de file upload (seguridad) | BAJA |

### Fase 4 — Frontend y E2E (Sprint 4, ~2 semanas)

Objetivo: E2E de los 5 flujos críticos de negocio.

| Tarea | Prioridad |
|-------|-----------|
| Setup Playwright + seed de datos E2E | ALTA |
| E2E Flujo 1: Ciclo de proyecto | ALTA |
| E2E Flujo 2: Presupuesto y APU | ALTA |
| E2E Flujo 3: Certificación | ALTA |
| E2E Flujo 5: RBAC | ALTA |
| Tests componentes formularios financieros | MEDIA |
| E2E Flujo 4: Redeterminación de precios | MEDIA |

---

## 11. CI/CD — GitHub Actions

**Archivo**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test-shared:
    name: Tests — shared package
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @construccion/shared test:coverage

  test-api:
    name: Tests — API
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: construccion_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/construccion_test
      JWT_SECRET: ci-test-jwt-secret-change-me!!
      JWT_REFRESH_SECRET: ci-test-refresh-secret-change!!
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:generate
      - run: pnpm --filter @construccion/api test:coverage
      - uses: codecov/codecov-action@v4

  test-e2e:
    name: Tests — E2E
    runs-on: ubuntu-latest
    needs: [test-api]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps chromium
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 12. Métricas y criterios de éxito

### Cobertura mínima aceptable para merge a main

| Paquete | Líneas | Funciones | Branches |
|---------|--------|-----------|----------|
| shared | 95% | 95% | 90% |
| api/services | 80% | 80% | 75% |
| api/middleware | 90% | 90% | 85% |
| api/integration | 75% endpoints cubiertos | — | — |

### KPIs de calidad

- Tiempo de ejecución de suite completa: < 5 minutos en CI
- Tests flaky (no determinísticos): 0 tolerados
- Cobertura nunca baja entre PRs (ratchet)
- Todos los bugs de seguridad reportados tienen test de regresión

---

## Apéndice: Orden de prioridad de bugs a cubrir con tests

Los siguientes bugs confirmados en la revisión de seguridad DEBEN tener tests de regresión
antes de aplicar el fix:

1. **XSS en reportes HTML** — `reports.routes.ts` y `certificates.service.ts`
   - Test primero, luego aplicar escaping
2. **JWT sin validación de secreto en producción** — `config/index.ts`
   - Test de startup, luego remover fallback
3. **IDOR en employees** — `employees.routes.ts` endpoints `:id/projects` y `:id/attendance`
   - Test de integración que demuestra el leak, luego aplicar org-filter
