# Manual de Uso - Sistema de Gestión de Construcción

## Índice

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Roles y Permisos](#roles-y-permisos)
4. [Diagrama de Flujo General](#diagrama-de-flujo-general)
5. [Configuración Inicial](#configuración-inicial)
6. [Gestión de Proyectos](#gestión-de-proyectos)
7. [Gestión de Etapas y Tareas](#gestión-de-etapas-y-tareas)
8. [Control de Gastos](#control-de-gastos)
9. [Gestión de Empleados](#gestión-de-empleados)
10. [Proveedores y Materiales](#proveedores-y-materiales)
11. [Reportes y Dashboard](#reportes-y-dashboard)
12. [Buenas Prácticas](#buenas-prácticas)

---

## Introducción

El Sistema de Gestión de Construcción es una herramienta integral diseñada para administrar obras de construcción en Argentina. Permite controlar proyectos, etapas, tareas, gastos, empleados, proveedores y materiales desde una única plataforma.

### Funcionalidades Principales

- **Gestión de Proyectos**: Crear y administrar obras con presupuestos y cronogramas
- **Diagrama Gantt**: Visualizar tareas y dependencias en línea de tiempo
- **Control de Costos**: Registrar gastos, aprobarlos y compararlos con el presupuesto
- **Gestión de Personal**: Administrar empleados y registrar asistencia
- **Inventario**: Control de materiales y stock
- **Proveedores**: Gestión de proveedores y cotizaciones

---

## Acceso al Sistema

### Iniciar Sesión

1. Ingresar a la URL del sistema
2. Introducir email y contraseña
3. Click en "Iniciar Sesión"

### Usuarios de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@constructorademo.com.ar | password123 |
| Jefe de Obra | jefe@constructorademo.com.ar | password123 |
| Supervisor | supervisor@constructorademo.com.ar | password123 |
| Administrativo | admin.contable@constructorademo.com.ar | password123 |
| Cliente (Solo lectura) | cliente@ejemplo.com.ar | password123 |

---

## Roles y Permisos

### Matriz de Permisos

| Función | Admin | Jefe de Obra | Supervisor | Administrativo | Solo Lectura |
|---------|:-----:|:------------:|:----------:|:--------------:|:------------:|
| **Proyectos** |
| Ver proyectos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Crear proyectos | ✓ | ✓ | ✗ | ✗ | ✗ |
| Editar proyectos | ✓ | ✓ | ✗ | ✗ | ✗ |
| Eliminar proyectos | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Etapas y Tareas** |
| Ver tareas | ✓ | ✓ | ✓ | ✓ | ✓ |
| Crear/Editar tareas | ✓ | ✓ | ✓ | ✗ | ✗ |
| Actualizar progreso | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Gastos** |
| Ver gastos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Registrar gastos | ✓ | ✓ | ✓ | ✓ | ✗ |
| Aprobar gastos | ✓ | ✓ | ✗ | ✗ | ✗ |
| **Empleados** |
| Ver empleados | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gestionar empleados | ✓ | ✓ | ✗ | ✓ | ✗ |
| Eliminar empleados | ✓ | ✗ | ✗ | ✗ | ✗ |
| Registrar asistencia | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Usuarios** |
| Gestionar usuarios | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## Diagrama de Flujo General

### Flujo Completo de Administración de un Proyecto

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONFIGURACIÓN INICIAL                                │
│  (Solo se hace una vez al comenzar a usar el sistema)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. CARGAR DATOS MAESTROS                                                    │
│  ├── Registrar Empleados (personal de obra)                                 │
│  ├── Registrar Proveedores (corralones, ferreterías, etc.)                  │
│  └── Cargar Materiales (catálogo de materiales con precios)                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CICLO DE VIDA DEL PROYECTO                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. CREAR PROYECTO                                                           │
│  ├── Nombre y descripción de la obra                                        │
│  ├── Ubicación (dirección, ciudad, provincia)                               │
│  ├── Fechas estimadas (inicio y fin)                                        │
│  ├── Presupuesto total estimado                                             │
│  └── Asignar Jefe de Obra responsable                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. DEFINIR ETAPAS                                                           │
│  ├── Trabajos Preliminares (limpieza, cerco, obrador)                       │
│  ├── Fundaciones (excavación, bases, hormigón)                              │
│  ├── Estructura (columnas, vigas, losas)                                    │
│  ├── Mampostería (paredes)                                                  │
│  ├── Instalaciones (electricidad, sanitarios, gas)                          │
│  └── Terminaciones (revoques, pisos, pintura)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. CREAR TAREAS EN CADA ETAPA                                               │
│  ├── Definir nombre y descripción                                           │
│  ├── Establecer fechas planificadas                                         │
│  ├── Estimar horas de trabajo                                               │
│  ├── Asignar prioridad (Alta, Media, Baja)                                  │
│  ├── Definir dependencias (qué tareas deben completarse antes)              │
│  └── Asignar empleados responsables                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. DEFINIR PRESUPUESTO                                                      │
│  ├── Presupuesto de Materiales                                              │
│  ├── Presupuesto de Mano de Obra                                            │
│  ├── Presupuesto de Equipos                                                 │
│  ├── Presupuesto de Subcontratistas                                         │
│  └── Contingencias (imprevistos)                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EJECUCIÓN DEL PROYECTO                               │
│                    (Ciclo diario/semanal durante la obra)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  CADA DÍA         │   │  CADA SEMANA      │   │  CUANDO OCURRA    │
├───────────────────┤   ├───────────────────┤   ├───────────────────┤
│ • Registrar       │   │ • Actualizar      │   │ • Registrar       │
│   asistencia de   │   │   progreso de     │   │   gastos y        │
│   empleados       │   │   tareas          │   │   compras         │
│                   │   │                   │   │                   │
│ • Revisar tareas  │   │ • Revisar         │   │ • Solicitar       │
│   del día         │   │   diagrama Gantt  │   │   aprobación de   │
│                   │   │                   │   │   gastos          │
│                   │   │ • Verificar       │   │                   │
│                   │   │   presupuesto vs  │   │ • Actualizar      │
│                   │   │   gastos reales   │   │   stock de        │
│                   │   │                   │   │   materiales      │
└───────────────────┘   └───────────────────┘   └───────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. FLUJO DE APROBACIÓN DE GASTOS                                            │
│                                                                              │
│  Administrativo          Jefe de Obra/Admin         Sistema                 │
│       │                        │                        │                   │
│       │  Registra gasto        │                        │                   │
│       ├───────────────────────►│                        │                   │
│       │                        │  Revisa y aprueba      │                   │
│       │                        ├───────────────────────►│                   │
│       │                        │                        │  Actualiza        │
│       │                        │                        │  presupuesto      │
│       │                        │◄───────────────────────┤                   │
│       │  Notificación          │                        │                   │
│       │◄───────────────────────┤                        │                   │
│       │                        │                        │                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. MONITOREO Y CONTROL                                                      │
│  ├── Revisar Dashboard con métricas generales                               │
│  ├── Analizar desviaciones de presupuesto                                   │
│  ├── Verificar progreso vs cronograma planificado                           │
│  ├── Generar reportes para stakeholders                                     │
│  └── Tomar acciones correctivas si es necesario                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  8. CIERRE DEL PROYECTO                                                      │
│  ├── Verificar que todas las tareas estén completadas                       │
│  ├── Revisar balance final de gastos                                        │
│  ├── Generar reporte final                                                  │
│  └── Cambiar estado del proyecto a "Completado"                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Configuración Inicial

### Paso 1: Cargar Empleados

Antes de iniciar cualquier proyecto, registre a todo el personal:

1. Ir a **Empleados** → **Nuevo Empleado**
2. Completar datos:
   - Nombre y Apellido
   - DNI y CUIL
   - Teléfono y Email
   - Puesto (Albañil, Electricista, Plomero, etc.)
   - Tipo de empleo (Permanente, Temporal, Contratista)
   - Fecha de ingreso
   - Tarifa por hora (para cálculo de costos)

### Paso 2: Cargar Proveedores

Registre sus proveedores habituales:

1. Ir a **Proveedores** → **Nuevo Proveedor**
2. Completar datos:
   - Razón social y nombre comercial
   - CUIT
   - Dirección, teléfono, email
   - Persona de contacto
   - Condiciones de pago (7 días, 30 días, etc.)
   - Calificación inicial

### Paso 3: Cargar Catálogo de Materiales

Cargue los materiales que utiliza frecuentemente:

1. Ir a **Materiales** → **Nuevo Material**
2. Completar datos:
   - Nombre y descripción
   - Unidad de medida (bolsa, m3, unidad, rollo, etc.)
   - Categoría
   - Stock mínimo requerido
   - Último precio de compra

---

## Gestión de Proyectos

### Crear un Nuevo Proyecto

1. Ir a **Proyectos** → **Nueva Obra**
2. Completar el formulario:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Nombre | Nombre descriptivo de la obra | Casa Familia Rodriguez |
| Descripción | Detalles del proyecto | Vivienda unifamiliar 180m2, 2 plantas |
| Dirección | Ubicación de la obra | Calle Los Pinos 456 |
| Ciudad | Ciudad | Nordelta |
| Provincia | Provincia | Buenos Aires |
| Fecha de Inicio | Cuándo comienza la obra | 01/02/2024 |
| Fecha Estimada de Fin | Cuándo debería terminar | 31/10/2024 |
| Presupuesto Estimado | Monto total del proyecto | $85.000.000 |

3. Click en **Crear Proyecto**

### Estados de un Proyecto

| Estado | Descripción | Cuándo usarlo |
|--------|-------------|---------------|
| **Planificación** | Proyecto en etapa de diseño | Antes de iniciar la obra |
| **En Progreso** | Obra en ejecución | Durante la construcción |
| **En Pausa** | Obra detenida temporalmente | Problemas, falta de materiales, etc. |
| **Completado** | Obra finalizada | Al entregar la obra |
| **Cancelado** | Proyecto cancelado | Si se cancela definitivamente |

---

## Gestión de Etapas y Tareas

### Crear Etapas

Las etapas representan las fases principales de la construcción:

1. Entrar al proyecto → **Etapas**
2. Click en **Nueva Etapa**
3. Definir:
   - Nombre de la etapa
   - Descripción
   - Orden (1, 2, 3...)
   - Fechas planificadas

### Etapas Típicas de una Obra

| Orden | Etapa | Descripción |
|-------|-------|-------------|
| 1 | Trabajos Preliminares | Limpieza, cerco, obrador, replanteo |
| 2 | Movimiento de Suelos | Excavaciones, rellenos, compactación |
| 3 | Fundaciones | Bases, vigas de fundación |
| 4 | Estructura | Columnas, vigas, losas |
| 5 | Mampostería | Paredes de ladrillo |
| 6 | Cubierta | Techo, impermeabilización |
| 7 | Instalación Sanitaria | Cañerías, artefactos |
| 8 | Instalación Eléctrica | Cableado, tableros, luminarias |
| 9 | Instalación de Gas | Cañerías, artefactos |
| 10 | Revoques | Grueso y fino |
| 11 | Contrapisos y Carpetas | Preparación para pisos |
| 12 | Pisos y Revestimientos | Cerámicos, porcelanatos |
| 13 | Carpintería | Puertas, ventanas |
| 14 | Pintura | Interior y exterior |
| 15 | Limpieza Final | Entrega de obra |

### Crear Tareas

Dentro de cada etapa, cree las tareas específicas:

1. En la etapa, click en **Nueva Tarea**
2. Completar:

| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre descriptivo de la tarea |
| Descripción | Detalles del trabajo a realizar |
| Prioridad | Alta / Media / Baja |
| Fecha de inicio | Cuándo comienza |
| Fecha de fin | Cuándo debe terminar |
| Horas estimadas | Cuántas horas de trabajo requiere |

### Dependencias entre Tareas

Las dependencias indican qué tareas deben completarse antes de iniciar otra:

**Tipos de Dependencia:**

| Tipo | Significado | Ejemplo |
|------|-------------|---------|
| FS (Fin-Inicio) | La tarea B inicia cuando termina A | Hormigonado después de encofrado |
| SS (Inicio-Inicio) | Ambas tareas inician juntas | Instalación eléctrica y sanitaria |
| FF (Fin-Fin) | Ambas tareas terminan juntas | Pintura interior y exterior |
| SF (Inicio-Fin) | Tarea B termina cuando inicia A | Poco común |

**Ejemplo de Dependencias en Estructura:**

```
Armado de Columnas ──FS──► Hormigonado de Columnas ──FS──► Encofrado de Losa ──FS──► Armado de Losa ──FS──► Hormigonado de Losa
```

### Diagrama Gantt

El diagrama Gantt permite visualizar todas las tareas en una línea de tiempo:

1. Entrar al proyecto → **Gantt**
2. Visualizar:
   - Barras de tareas con fechas
   - Líneas de dependencia
   - Progreso actual
   - Tareas críticas (en rojo)

---

## Control de Gastos

### Flujo de Gastos

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Registrar  │────►│   Pendiente  │────►│   Aprobado   │────►│    Pagado    │
│    Gasto     │     │  Aprobación  │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Rechazado  │
                     └──────────────┘
```

### Registrar un Gasto

1. Ir a **Gastos** → **Nuevo Gasto**
2. Completar:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| Proyecto | Obra asociada | Casa Familia Rodriguez |
| Tarea (opcional) | Tarea específica | Hormigonado de losa |
| Categoría | Tipo de gasto | Materiales |
| Descripción | Detalle del gasto | Cemento Portland x 100 bolsas |
| Monto | Valor sin IVA | $850.000 |
| IVA | Impuesto | $178.500 |
| Total | Monto final | $1.028.500 |
| Proveedor | Quién provee | Corralón El Constructor |
| Factura | Número de comprobante | A-0001-00045678 |
| Fecha | Fecha del gasto | 10/02/2024 |

### Categorías de Gastos

| Categoría | Código | Descripción |
|-----------|--------|-------------|
| Materiales | MAT | Cemento, ladrillos, hierros, etc. |
| Mano de Obra | MO | Jornales, horas extra |
| Equipos | EQ | Alquiler de maquinaria |
| Subcontratistas | SUB | Trabajos terciarizados |
| Transporte | TRANS | Fletes, combustible |
| Administrativos | ADM | Permisos, seguros, honorarios |

### Aprobar Gastos (Jefe de Obra / Admin)

1. Ir a **Gastos** → Filtrar por "Pendiente de aprobación"
2. Revisar el detalle del gasto
3. Click en **Aprobar** o **Rechazar**

---

## Gestión de Empleados

### Asistencia Diaria

Registre la asistencia del personal cada día:

1. Ir a **Empleados** → **Asistencia**
2. Seleccionar fecha
3. Para cada empleado, marcar:

| Estado | Descripción |
|--------|-------------|
| Presente | Asistió normalmente |
| Ausente | No asistió |
| Licencia | Ausencia justificada |
| Vacaciones | En período de vacaciones |
| Feriado | Día no laborable |

4. Registrar hora de entrada y salida
5. Agregar horas extra si corresponde

### Asignar Empleados a Proyectos

1. Entrar al proyecto → **Equipo**
2. Click en **Asignar Empleado**
3. Seleccionar empleado y rol en el proyecto

---

## Proveedores y Materiales

### Gestión de Stock

1. Ir a **Materiales** → **Stock**
2. Visualizar:
   - Stock actual
   - Stock mínimo
   - Alertas de bajo stock

### Movimientos de Stock

Registre entradas y salidas de materiales:

**Entrada (compra):**
1. Click en **Entrada de Stock**
2. Seleccionar material
3. Indicar cantidad y proveedor

**Salida (uso en obra):**
1. Click en **Salida de Stock**
2. Seleccionar material
3. Indicar cantidad y proyecto destino

---

## Reportes y Dashboard

### Dashboard Principal

El dashboard muestra métricas clave:

| Métrica | Descripción |
|---------|-------------|
| Proyectos Activos | Cantidad de obras en ejecución |
| Gastos del Mes | Total gastado en el período |
| Presupuesto Disponible | Lo que queda por gastar |
| Tareas Pendientes | Tareas sin completar |
| Empleados Presentes | Personal trabajando hoy |

### Reportes Disponibles

Acceder a **Reportes** desde el menú lateral.

| Reporte | Descripción | Útil para |
|---------|-------------|-----------|
| Dashboard de Reportes | Métricas generales con gráficos | Vista rápida del estado |
| Gastos por Categoría | Distribución de gastos (gráfico de barras) | Análisis de costos |
| Progreso de Proyectos | Estado de avance de obras activas | Control de cronograma |
| Gastos Mensuales | Evolución de gastos en el tiempo | Tendencias |
| Exportar PDF | Reporte HTML con tablas de proyectos y gastos | Reuniones con cliente |
| Exportar Excel | CSV con datos de proyectos y gastos | Análisis en planilla |

### Filtros de Reportes

| Filtro | Opciones |
|--------|----------|
| Período | Última semana, Último mes, Último trimestre, Último año, Todo |
| Proyecto | Todos o uno específico |

---

## Buenas Prácticas

### Para una Gestión Exitosa

1. **Actualizar diariamente**
   - Registrar asistencia todos los días
   - Cargar gastos ni bien se producen
   - Actualizar progreso de tareas

2. **Revisar semanalmente**
   - Comparar avance real vs. planificado
   - Verificar desviaciones de presupuesto
   - Revisar diagrama Gantt

3. **Documentar siempre**
   - Adjuntar facturas a los gastos
   - Agregar notas a las tareas
   - Registrar incidentes o problemas

4. **Usar dependencias correctamente**
   - Definir dependencias lógicas entre tareas
   - El Gantt ayuda a identificar el camino crítico

5. **Control de presupuesto**
   - Revisar gastos vs. presupuesto regularmente
   - Actuar rápido ante desviaciones
   - Solicitar aprobación antes de gastos grandes

### Errores Comunes a Evitar

| Error | Consecuencia | Cómo evitarlo |
|-------|--------------|---------------|
| No registrar gastos menores | Pérdida de control de costos | Registrar TODO gasto |
| Olvidar actualizar progreso | Cronograma desactualizado | Actualizar semanalmente |
| No definir dependencias | Gantt inútil | Pensar qué depende de qué |
| Asistencia incompleta | Errores en liquidación | Registrar a diario |
| Gastos sin aprobar | Demoras en pagos | Revisar pendientes diariamente |

---

## Soporte

Si tiene dudas o problemas con el sistema:

- Revisar este manual
- Contactar al administrador del sistema
- Reportar errores en el sistema

---

*Manual de Uso - Sistema de Gestión de Construcción v1.0*
*Última actualización: Febrero 2024*
