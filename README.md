# Sistema de Gestión de Construcción

Sistema completo para la gestión de obras de construcción, desarrollado para el mercado argentino. Permite administrar proyectos, planes de trabajo, costos, proveedores, materiales y personal.

## Stack Tecnológico

- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: PostgreSQL + Prisma ORM
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS
- **Autenticación**: JWT con refresh tokens
- **Estructura**: Monorepo (pnpm workspaces + Turborepo)

## Estructura del Proyecto

```
construccion-app/
├── apps/
│   ├── api/                 # Backend Express
│   └── web/                 # Frontend Next.js
├── packages/
│   ├── database/            # Prisma schema y cliente
│   ├── shared/              # Tipos y utilidades compartidas
│   ├── ui/                  # Componentes UI compartidos
│   └── typescript-config/   # Configuraciones TypeScript
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Requisitos Previos

- Node.js >= 20
- pnpm >= 9.0
- PostgreSQL >= 14
- Git

## Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd construccion-app
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Copiar los archivos de ejemplo y configurar:

```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env

# Database
cp packages/database/.env.example packages/database/.env
```

Configurar las variables en cada archivo `.env`:

**packages/database/.env**:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/construccion_db"
```

**apps/api/.env**:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://usuario:password@localhost:5432/construccion_db"
JWT_SECRET=tu-secreto-jwt-super-seguro
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
```

**apps/web/.env**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 4. Crear la base de datos

```bash
# Crear la base de datos en PostgreSQL
createdb construccion_db

# O usando psql:
psql -U postgres -c "CREATE DATABASE construccion_db;"
```

### 5. Ejecutar migraciones

```bash
pnpm db:push
# o para crear migraciones:
pnpm db:migrate
```

### 6. Cargar datos de ejemplo

```bash
pnpm db:seed
```

### 7. Iniciar el proyecto

```bash
# Desarrollo (ambos servicios)
pnpm dev

# Solo backend
pnpm --filter @construccion/api dev

# Solo frontend
pnpm --filter @construccion/web dev
```

## Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: `pnpm db:studio`

### Credenciales de prueba

| Rol | Email | Password |
|-----|-------|----------|
| Administrador | admin@constructorademo.com.ar | password123 |
| Jefe de Obra | jefe@constructorademo.com.ar | password123 |
| Supervisor | supervisor@constructorademo.com.ar | password123 |
| Administrativo | admin.contable@constructorademo.com.ar | password123 |
| Solo Lectura | cliente@ejemplo.com.ar | password123 |

## Funcionalidades

### Gestión de Obras
- Crear y administrar múltiples proyectos
- Seguimiento de estado (planificación, en curso, pausada, finalizada)
- Información de ubicación y responsables
- Documentación asociada

### Plan de Trabajo
- Definir etapas de construcción
- Gestión de tareas con dependencias
- Diagrama de Gantt visual
- Asignación de personal a tareas
- Seguimiento de progreso

### Gestión de Costos
- Presupuestos por categoría
- Registro de gastos con aprobaciones
- Órdenes de compra
- Comparativa presupuestado vs gastado
- Alertas de sobre-presupuesto

### Proveedores y Materiales
- Base de datos de proveedores
- Catálogo de materiales
- Control de stock
- Alertas de stock bajo

### Personal
- Gestión de empleados
- Registro de asistencia
- Asignación a proyectos

### Reportes
- Dashboard ejecutivo
- Reportes de costos por proyecto
- Exportación a PDF y Excel

## API Endpoints

### Autenticación
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Proyectos
```
GET    /api/v1/projects
GET    /api/v1/projects/:id
POST   /api/v1/projects
PUT    /api/v1/projects/:id
DELETE /api/v1/projects/:id
GET    /api/v1/projects/:id/gantt
GET    /api/v1/projects/:id/budget-status
```

### Etapas y Tareas
```
GET    /api/v1/projects/:projectId/stages
POST   /api/v1/projects/:projectId/stages
GET    /api/v1/stages/:stageId/tasks
POST   /api/v1/stages/:stageId/tasks
PATCH  /api/v1/tasks/:id/status
POST   /api/v1/tasks/:id/dependencies
```

### Gastos
```
GET    /api/v1/expenses
POST   /api/v1/expenses
PATCH  /api/v1/expenses/:id/approve
PATCH  /api/v1/expenses/:id/reject
```

### Materiales
```
GET    /api/v1/materials
POST   /api/v1/materials
GET    /api/v1/materials/low-stock
POST   /api/v1/materials/:id/stock-movement
```

### Reportes
```
GET    /api/v1/reports/dashboard
GET    /api/v1/reports/projects/:id/costs
GET    /api/v1/reports/projects/:id/progress
```

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Inicia todo el proyecto
pnpm build            # Compila todo
pnpm lint             # Ejecuta linters
pnpm test             # Ejecuta tests

# Base de datos
pnpm db:generate      # Genera cliente Prisma
pnpm db:push          # Sincroniza schema con DB
pnpm db:migrate       # Crea migración
pnpm db:seed          # Carga datos de ejemplo
pnpm db:studio        # Abre Prisma Studio

# Limpieza
pnpm clean            # Limpia node_modules y builds
```

## Roles y Permisos

| Acción | Admin | Jefe Obra | Supervisor | Administrativo | Solo Lectura |
|--------|-------|-----------|------------|----------------|--------------|
| Ver proyectos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Crear proyectos | ✓ | ✓ | - | - | - |
| Gestionar tareas | ✓ | ✓ | ✓ | - | - |
| Aprobar gastos | ✓ | ✓ | - | - | - |
| Registrar gastos | ✓ | ✓ | ✓ | ✓ | - |
| Gestionar usuarios | ✓ | - | - | - | - |
| Gestionar empleados | ✓ | ✓ | - | ✓ | - |

## Consideraciones para Producción

1. **Variables de entorno**: Configurar secrets seguros para JWT
2. **HTTPS**: Configurar certificado SSL
3. **Base de datos**: Usar conexión segura con SSL
4. **CORS**: Configurar dominios permitidos
5. **Rate limiting**: Implementar límites de requests
6. **Logging**: Configurar sistema de logs centralizado
7. **Backups**: Configurar backups automáticos de DB

## Tecnologías Utilizadas

- [Express](https://expressjs.com/) - Framework web
- [Prisma](https://www.prisma.io/) - ORM
- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Estilos
- [TanStack Query](https://tanstack.com/query) - Estado del servidor
- [Zustand](https://zustand-demo.pmnd.rs/) - Estado global
- [React Hook Form](https://react-hook-form.com/) - Formularios
- [Zod](https://zod.dev/) - Validación
- [Recharts](https://recharts.org/) - Gráficos

## Licencia

Proyecto privado - Todos los derechos reservados.

## Soporte

Para soporte técnico, contactar a: soporte@constructorademo.com.ar
