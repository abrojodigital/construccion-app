# Manual de Uso — Sistema de Gestión de Construcción

## Índice

1. [Acceso y roles](#1-acceso-y-roles)
2. [Tablero (Dashboard)](#2-tablero-dashboard)
3. [Gestión de Proyectos](#3-gestión-de-proyectos)
4. [Rubros, Tareas e Ítems](#4-rubros-tareas-e-ítems)
5. [Diagrama de Gantt](#5-diagrama-de-gantt)
6. [Presupuesto Versionado](#6-presupuesto-versionado)
7. [Análisis de Precios Unitarios (APU)](#7-análisis-de-precios-unitarios-apu)
8. [Avance Físico](#8-avance-físico)
9. [Certificaciones de Obra](#9-certificaciones-de-obra)
10. [Subcontrataciones](#10-subcontrataciones)
11. [Monedas y Tipos de Cambio](#11-monedas-y-tipos-de-cambio)
12. [Redeterminación de Precios](#12-redeterminación-de-precios)
13. [Control Presupuestario](#13-control-presupuestario)
14. [Plan Financiero](#14-plan-financiero)
15. [Control de Gastos](#15-control-de-gastos)
16. [Proveedores](#16-proveedores)
17. [Materiales e Inventario](#17-materiales-e-inventario)
18. [Empleados y Asistencia](#18-empleados-y-asistencia)
19. [Reportes](#19-reportes)
20. [Configuración y Usuarios](#20-configuración-y-usuarios)

---

## 1. Acceso y roles

### Iniciar sesión

1. Ingresar a http://localhost:3000
2. Ingresar email y contraseña
3. Click en **Iniciar Sesión**

La sesión se mantiene activa mediante refresh tokens. Si el token expira se redirige automáticamente al login.

### Usuarios demo

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@constructorademo.com.ar | password123 |
| Jefe de Obra | jefe@constructorademo.com.ar | password123 |
| Supervisor | supervisor@constructorademo.com.ar | password123 |
| Administrativo | admin2@constructorademo.com.ar | password123 |
| Solo Lectura | lector@constructorademo.com.ar | password123 |

### Matriz de permisos

| Acción | ADMIN | PROJECT_MANAGER | SUPERVISOR | ADMINISTRATIVE | READ_ONLY |
|--------|:-----:|:---------------:|:----------:|:--------------:|:---------:|
| Crear / editar proyectos | ✓ | ✓ | — | — | — |
| Rubros, tareas e ítems | ✓ | ✓ | ✓ | — | — |
| Registrar gastos | ✓ | ✓ | ✓ | ✓ | — |
| Aprobar / rechazar gastos | ✓ | ✓ | — | — | — |
| Presupuestos y APU | ✓ | ✓ | — | ✓ | — |
| Aprobar presupuestos | ✓ | ✓ | — | — | — |
| Certificaciones | ✓ | ✓ | — | ✓ | — |
| Subcontrataciones | ✓ | ✓ | — | ✓ | — |
| Gestionar empleados | ✓ | ✓ | — | ✓ | — |
| Gestionar proveedores | ✓ | ✓ | — | ✓ | — |
| Gestionar materiales | ✓ | ✓ | ✓ | ✓ | — |
| Redeterminación de precios | ✓ | ✓ | — | ✓ | — |
| Gestionar usuarios | ✓ | — | — | — | — |
| Consulta general | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 2. Tablero (Dashboard)

El tablero es la pantalla principal. Muestra el estado operativo de toda la organización.

### KPIs principales

- **Proyectos Activos** — cantidad de obras en estado EN_PROGRESO
- **Presupuesto Total** — suma de presupuestos estimados · porcentaje ejecutado
- **Tareas Vencidas** — ítems con fecha de fin pasada y sin completar
- **Aprobaciones Pendientes** — gastos en estado PENDING_APPROVAL
- **Gasto Total** — suma de gastos aprobados y pagados
- **Proyectos Completados** — obras finalizadas
- **Stock Bajo** — materiales por debajo del stock mínimo

### Gráficos

- **Gastos Mensuales** — evolución mensual de gastos aprobados y pagados
- **Estado de Proyectos** — distribución por estado (dona)
- **Avance por Obra** — avance físico vs. ejecución presupuestaria (barras)

### Lista de proyectos activos

Muestra cada proyecto con barra de avance físico, barra de ejecución presupuestaria, estado y días restantes (o días de retraso en rojo).

---

## 3. Gestión de Proyectos

Menú: **Proyectos**

### Crear un proyecto

1. Click en **Nuevo Proyecto**
2. Completar: nombre, dirección, ciudad, provincia, responsable, presupuesto estimado
3. Opcionalmente: fechas de inicio y fin estimadas, descripción
4. Click en **Crear Proyecto**

El sistema asigna automáticamente un código único (`OBR-YYYY-NNNNN`).

### Detalle de un proyecto

Desde la lista, click en el nombre del proyecto. Se muestran:

- **Información general**: estado, código, responsable, presupuesto, avance
- **KPIs**: gasto ejecutado, tareas pendientes, empleados asignados, documentos
- **Accesos rápidos**: Rubros y Tareas, Diagrama Gantt, Presupuesto, Gastos, Equipo, Certificaciones, Subcontratos, **Control Presupuestario**, **Plan Financiero**, Documentos

### Estados de un proyecto

| Estado | Descripción |
|--------|-------------|
| PLANNING | En planificación, sin comenzar |
| IN_PROGRESS | En ejecución |
| ON_HOLD | Pausado |
| COMPLETED | Finalizado |
| CANCELLED | Cancelado |

---

## 4. Rubros, Tareas e Ítems

Menú: Proyecto → **Rubros y Tareas**

El sistema organiza el plan de trabajo en 3 niveles jerárquicos:

```
Rubro (nivel 0)
└── Tarea (nivel 1)
    └── Ítem (nivel 2)
```

- **Rubro**: agrupador principal (ej: "Estructura", "Instalaciones Eléctricas")
- **Tarea**: subdivisión del rubro (ej: "Columnas", "Vigas")
- **Ítem**: trabajo específico asignable con fecha, prioridad y responsable (ej: "Hormigonado columna C1")

### Crear un Rubro

1. Click en **+ Agregar Rubro**
2. Ingresar nombre, descripción, fechas planificadas y progreso inicial
3. Click en **Crear**

### Crear una Tarea dentro de un Rubro

1. Expandir el rubro con el botón de flecha
2. Click en **+ Agregar Tarea**
3. Completar datos y guardar

### Crear un Ítem dentro de una Tarea

1. Expandir la tarea
2. Click en **+ Agregar Ítem**
3. Completar: nombre, descripción, estado, prioridad, fechas, progreso
4. Opcionalmente asignar a un empleado o usuario

### Estados de un Ítem

| Estado | Color |
|--------|-------|
| PENDING | Gris |
| IN_PROGRESS | Azul |
| COMPLETED | Verde |
| BLOCKED | Rojo |
| CANCELLED | Gris tenue |

### Prioridades

LOW · MEDIUM · HIGH · URGENT

---

## 5. Diagrama de Gantt

Menú: Proyecto → **Diagrama de Gantt** (ícono de calendario en la barra superior del proyecto)

Visualiza el cronograma del proyecto en una línea de tiempo horizontal.

### Vistas disponibles

| Vista | Muestra |
|-------|---------|
| Rubros | Solo los rubros (nivel superior) |
| Tareas | Rubros y tareas |
| Ítems | La jerarquía completa (defecto) |

Cada vista muestra un contador de elementos. Cambiar la vista no afecta los datos.

### Cómo leer el diagrama

- **Barra amarilla** — Rubro
- **Barra índigo** — Tarea
- **Barra azul** — Ítem en estado PENDING
- **Barra verde** — Ítem completado
- **Barra roja** — Ítem bloqueado
- **Overlay oscuro sobre la barra** — porcentaje de avance completado
- **Línea roja vertical** — día de hoy
- **"Sin fechas"** — el elemento no tiene fechas cargadas aún

### Exportar a PDF

Click en **Exportar PDF** (esquina superior derecha). Se imprime la vista actual.

---

## 6. Presupuesto Versionado

Menú: Proyecto → **Presupuesto**

Permite manejar múltiples versiones del presupuesto con cálculo automático del coeficiente K.

### Estructura

```
Versión de Presupuesto
└── Rubro (número + nombre)
    └── Tarea (número · descripción · unidad · cantidad · precio unitario)
        └── Ítem (desglose)
```

### Crear una nueva versión

1. Click en **Nueva Versión**
2. Ingresar nombre y descripción
3. Configurar porcentajes:
   - **Gastos Generales (GG)**
   - **Beneficio**
   - **Gastos Financieros (GF)**
   - **IVA**
4. El sistema calcula automáticamente el **Coeficiente K**:
   ```
   K = (1 + GG) × (1 + B) × (1 + GF) × (1 + IVA)
   ```

### Agregar Rubros y Tareas

1. Con la versión en estado BORRADOR, click en **+ Agregar Rubro**
2. Dentro del rubro, click en **+ Tarea** para agregar líneas con cantidad y precio unitario
3. El sistema calcula subtotales y totales automáticamente

### Generar cronograma desde el presupuesto

1. Click en **Generar Cronograma**
2. Elegir modo: **Reemplazar** (borra el existente) o **Agregar** (sin borrar)
3. El sistema crea Rubros y Tareas en el plan de trabajo a partir de la estructura del presupuesto

### Aprobar un presupuesto

1. Click en **Aprobar Versión**
2. Confirmar la acción
3. Una vez aprobado, el presupuesto queda en modo solo lectura
4. Si hay una versión anterior aprobada, pasa a estado SUPERSEDIDO

### Estados de una versión

| Estado | Descripción |
|--------|-------------|
| DRAFT | En edición, se puede modificar |
| APPROVED | Aprobado, solo lectura |
| SUPERSEDED | Reemplazado por una versión más nueva |

---

## 7. Análisis de Precios Unitarios (APU)

Menú: Proyecto → Presupuesto → Versión → Ítem → **Ver APU**

Permite desglosar el costo unitario de cada ítem del presupuesto en 6 secciones:

| Sección | Contenido |
|---------|-----------|
| Materiales | Insumos con cantidad y precio unitario |
| Mano de Obra | Categorías laborales con jornales |
| Equipos (D) | Equipos de uso directo |
| Equipos (E) | Equipos de uso indirecto |
| Equipos (F) | Equipos de movimiento |
| Transporte | Fletes y acarreos |

### Agregar componentes

1. En la sección correspondiente, click en **+ Agregar**
2. Completar: descripción, unidad, cantidad y precio unitario
3. El subtotal se calcula automáticamente
4. El **Costo Directo Total** suma todas las secciones

---

## 8. Avance Físico

Menú: Proyecto → Presupuesto → Versión → **Avance Físico**

Registra el porcentaje de avance de cada ítem presupuestado.

### Registrar avance

1. En la columna **Avance**, ingresar el valor entre 0 y 1 (ej: 0.75 = 75%)
2. Click en **Guardar Avance**
3. El sistema calcula el **monto ejecutado** multiplicando el avance por el precio total del ítem

### Vista resumen

- Avance por rubro (promedio ponderado)
- Avance global de la versión
- Monto total ejecutado vs. presupuestado

---

## 9. Certificaciones de Obra

Menú: Proyecto → **Certificaciones**

Los certificados documentan el trabajo ejecutado en un período y se usan para facturar al comitente.

### Crear un certificado

1. Click en **Nuevo Certificado**
2. Definir el período (fecha inicio y fin)
3. El sistema asigna un número correlativo (`CERT-YYYY-NNNNN`)

### Completar un certificado (estado BORRADOR)

En estado BORRADOR se pueden editar los avances de cada ítem:

1. Para cada línea, ingresar el **% de avance acumulado** en el período
2. El sistema calcula: avance del período = acumulado actual − acumulado anterior
3. El subtotal se calcula multiplicando el avance del período por el precio del ítem

### Deducciones

El certificado permite aplicar deducciones al subtotal:

| Deducción | Descripción |
|-----------|-------------|
| Acopio | Devolución de materiales entregados en advance |
| Anticipo | Amortización del anticipo otorgado |
| Fondo de Reparo | Retención por garantía de obra |
| IVA | Impuesto al Valor Agregado |

### Flujo de estados

```
DRAFT → SUBMITTED → APPROVED → PAID
```

- **DRAFT**: editable por PROJECT_MANAGER y ADMINISTRATIVE
- **SUBMITTED**: enviado para aprobación
- **APPROVED**: aprobado, listo para pagar
- **PAID**: cobrado

---

## 10. Subcontrataciones

Menú: Proyecto → **Subcontratos**

Permite gestionar trabajos delegados a empresas subcontratistas.

### Crear un subcontrato

1. Click en **Nuevo Subcontrato**
2. Completar:
   - Datos del contratista: nombre, CUIT, contacto
   - Descripción del alcance
   - Monto total pactado
3. El sistema asigna código automático

### Agregar ítems al subcontrato

Cada subcontrato tiene líneas de trabajo con:
- Descripción, unidad, cantidad y precio unitario
- Opcionalmente vinculado a un ítem del presupuesto

### Certificación de subcontratos

Los subcontratos tienen su propio ciclo de certificación, independiente del certificado principal de obra.

### Estados

DRAFT → ACTIVE → COMPLETED → CANCELLED

---

## 11. Monedas y Tipos de Cambio

Menú: **Monedas**

### Gestionar monedas

El sistema viene con ARS, USD y EUR. Se pueden agregar otras monedas con su código ISO y símbolo.

### Registrar tipos de cambio

1. Ingresar a la moneda deseada (ej: USD)
2. Click en **+ Agregar Tipo de Cambio**
3. Ingresar: fecha, valor en ARS, fuente (ej: BCRA, mercado)

Los tipos de cambio son históricos: cada registro corresponde a una fecha específica.

---

## 12. Redeterminación de Precios

Menú: **Redeterminación**

Sistema de ajuste de precios según variación de índices, aplicado en contratos de obra pública argentina.

### Componentes

#### Índices de Precios

Registros históricos de índices publicados por organismos como INDEC:
- Índice de materiales de construcción
- Índice de mano de obra
- Índice de equipos y maquinaria

Para agregar valores históricos: ingresar al índice → **+ Agregar Valor** → fecha y valor.

#### Fórmulas de Redeterminación

Fórmulas polinómicas con pesos (coeficientes) asignados a cada índice.

> Los pesos de todos los componentes deben sumar **exactamente 1.0 (100%)**.

Ejemplo:
```
Factor = 0.40 × (I_materiales / I_materiales_base)
       + 0.35 × (I_mano_obra / I_mano_obra_base)
       + 0.25 × (I_equipos / I_equipos_base)
```

#### Calculadora de ajuste

Menú: Proyecto → **Calcular Redeterminación**

1. Seleccionar la fórmula
2. Ingresar fecha base (inicio del contrato) y fecha actual
3. El sistema busca los valores de índice para ambas fechas y calcula el factor de ajuste

---

## 13. Control Presupuestario

Menú: Proyecto → **Control Presupuestario**

Permite comparar, ítem por ítem, lo presupuestado contra lo certificado al comitente y lo realmente gastado. Es la principal herramienta de seguimiento financiero de la obra.

> Requiere que el proyecto tenga al menos una versión de presupuesto **aprobada**.

### Resumen en tarjetas

| Tarjeta | Descripción |
|---------|-------------|
| Presupuesto Total | Monto total de la versión aprobada (con coeficiente K) |
| Gastado Real | Suma de gastos APPROVED + PAID · % ejecutado |
| Certificado | Suma de certificaciones aprobadas · % certificado |
| Variación | Diferencia presupuesto − gastado (positiva = superávit) |

### Tabla jerárquica

La tabla despliega la misma estructura del presupuesto aprobado en tres niveles expandibles:

```
Rubro
└── Tarea (presupuestaria)
    └── Ítem
```

Para cada nivel se muestran las columnas:

| Columna | Descripción |
|---------|-------------|
| N° | Número del ítem en el presupuesto |
| Descripción | Nombre del rubro / tarea / ítem |
| Ud. | Unidad de medida |
| Cant. | Cantidad presupuestada |
| P. Unit. | Precio unitario (con K) |
| Presupuesto | Monto total presupuestado |
| Certificado | Monto certificado al comitente |
| Gastado Real | Gastos reales imputados (en ámbar) |
| Av. Físico | Porcentaje de avance registrado |
| Variación | Presupuesto − Gastado Real |

- Click en la fila de un **Rubro** o **Tarea** para expandir/colapsar sus hijos.
- Las filas con variación negativa (sobrecosto) se resaltan en rojo.

### Gastos por categoría

Debajo de la tabla jerárquica se muestra un gráfico de barras con el gasto real agrupado por categoría (materiales, mano de obra, equipos, etc.).

### Historial de certificados

Listado de todos los certificados del proyecto con:
- Número de certificado, período, estado y monto neto
- Enlace directo al detalle de cada certificado

### Imputar gastos a ítems presupuestarios

Para que un gasto aparezca en la columna **Gastado Real** del ítem correcto, al registrar el gasto se debe completar el campo **Ítem Presupuestario**. Ver sección [15. Control de Gastos](#15-control-de-gastos).

---

## 14. Plan Financiero

Menú: Proyecto → **Plan Financiero**

Permite planificar el flujo de fondos de la obra mes a mes, comparando lo proyectado con lo certificado y ejecutado.

### Crear un plan financiero

1. Click en **Nuevo Plan**
2. Ingresar nombre y descripción
3. Guardar como borrador

### Lista de planes

Desde la pantalla de lista se puede:
- Ver todos los planes del proyecto (DRAFT / APPROVED)
- Hacer click en la tarjeta de un plan para ingresar al detalle
- Eliminar planes en borrador con el ícono de papelera

### Detalle del plan

La pantalla de detalle muestra:

#### Tarjetas resumen

| Tarjeta | Descripción |
|---------|-------------|
| Total Proyectado | Suma de todos los períodos planificados |
| Certificado | Monto real certificado · % sobre lo proyectado |
| Ejecutado | Gasto real ejecutado · % sobre lo proyectado |
| Desglose por Rubro | Resumen de lo proyectado por categoría |

#### Gráficos

- **Curva S** — Acumulado proyectado vs. certificado vs. ejecutado a lo largo del tiempo
- **Gráfico de barras mensual** — Proyectado / Certificado / Ejecutado por período

#### Tabla de períodos

Muestra todos los meses del plan con columnas:

| Columna | Descripción |
|---------|-------------|
| Período | Año y mes |
| Proyectado | Monto planificado |
| Certificado | Monto realmente certificado |
| Ejecutado | Gasto real del período |
| Av. Planificado | % de avance planificado acumulado |
| Av. Real | % de avance físico real acumulado |
| Diferencia | Proyectado − Ejecutado |

En modo **BORRADOR** cada fila tiene botones de edición y eliminación.

### Agregar períodos manualmente

1. Click en **+ Agregar Período**
2. Completar:
   - Año y mes
   - Montos proyectados: obras civiles, materiales, mano de obra, equipos, gastos generales, subcontratos, imprevistos
   - Avance planificado (0–100 %)
   - Notas opcionales

### Generar períodos en lote

Para crear rápidamente un rango de meses:

1. Click en **Generar en Lote**
2. Seleccionar mes/año de inicio y de fin
3. Ingresar el monto total a distribuir
4. Elegir el método de distribución:
   - **Igual** — divide el monto en partes iguales entre todos los meses
   - **Lineal** — el sistema calcula una distribución triangular (arranque gradual, pico en el centro, reducción al final)
5. Click en **Generar**

El sistema crea un período por mes. Si algún mes ya existe, lo omite automáticamente.

### Aprobar un plan financiero

1. En el detalle del plan, click en **Aprobar Plan**
2. Confirmar la acción
3. Una vez aprobado, el plan queda en modo solo lectura y no se pueden agregar ni editar períodos

### Estados del plan

| Estado | Descripción |
|--------|-------------|
| DRAFT | En edición, se pueden agregar y modificar períodos |
| APPROVED | Aprobado, solo lectura |

---

## 15. Control de Gastos

Menú: **Gastos**

### Registrar un gasto

1. Click en **Nuevo Gasto**
2. Completar:
   - Proyecto al que pertenece
   - Categoría (materiales, mano de obra, equipos, etc.)
   - Proveedor (opcional)
   - Descripción e importe
   - Tipo de comprobante (Factura A, B o C) y número
   - Fecha
   - **Ítem Presupuestario** _(opcional)_ — vincula el gasto a un ítem del presupuesto aprobado para que aparezca en el Control Presupuestario
3. Guardar como **Borrador** o enviar a aprobación directamente

El sistema genera código automático (`GAS-YYYY-NNNNN`).

> **Tip:** Imputar cada gasto a su ítem presupuestario correspondiente permite obtener el reporte de Control Presupuestario con máximo detalle (columna **Gastado Real** por ítem).

### Flujo de aprobación

```
DRAFT → PENDING_APPROVAL → APPROVED → PAID
                        ↓
                     REJECTED
```

- **PROJECT_MANAGER** y **ADMIN** pueden aprobar y rechazar
- Al aprobar o rechazar, el gasto queda como solo lectura
- Los gastos APPROVED y PAID impactan en el KPI de ejecución presupuestaria del proyecto

### Filtros disponibles

- Por proyecto
- Por estado
- Por texto (descripción o referencia)
- Por fecha

---

## 16. Proveedores

Menú: **Proveedores**

### Crear un proveedor

1. Click en **Nuevo Proveedor**
2. Completar:
   - Razón social y CUIT (con validación de dígito verificador)
   - Dirección y contacto
   - Datos bancarios: CBU y banco
   - Categorías de suministro

### Datos relevantes

Desde el detalle del proveedor se pueden ver todos los gastos y órdenes de compra asociados.

---

## 17. Materiales e Inventario

Menú: **Materiales**

### Agregar un material

1. Click en **Nuevo Material**
2. Completar: nombre, código, categoría, unidad de medida
3. Definir: stock actual, stock mínimo y precio unitario

### Control de stock

El sistema alerta cuando el stock de un material cae por debajo del **stock mínimo**. El KPI "Stock Bajo" en el tablero muestra cuántos materiales están en esa situación.

### Movimientos de stock

Desde el detalle del material se registran entradas y salidas con fecha y motivo.

---

## 18. Empleados y Asistencia

Menú: **Empleados**

### Registrar un empleado

1. Click en **Nuevo Empleado**
2. Completar:
   - Datos personales: nombre, DNI, CUIL (con validación)
   - Categoría laboral y especialidad
   - Datos bancarios (CBU)
   - Contacto de emergencia

### Asignar a un proyecto

Desde el detalle del proyecto → **Equipo** → asignar empleado con fecha de inicio.

### Registro de asistencia

Desde el detalle del empleado → **Asistencia** → registrar por día:

| Tipo | Descripción |
|------|-------------|
| PRESENT | Presente jornada completa |
| ABSENT | Ausente sin justificación |
| LATE | Llegó tarde |
| HALF_DAY | Media jornada |
| VACATION | Vacaciones |
| SICK_LEAVE | Licencia médica |

---

## 19. Reportes

Menú: **Reportes**

### Dashboard ejecutivo

Disponible en la pantalla principal (Tablero). Consolida todos los KPIs de la organización.

### Reportes por proyecto

Desde el detalle de cada proyecto:

- **Resumen financiero**: presupuestado vs. gastado por categoría
- **Estado del presupuesto**: desglose por rubro con porcentajes de ejecución
- **Avance físico**: progreso por ítem con montos ejecutados

---

## 20. Configuración y Usuarios

Menú: **Configuración**

### Gestionar usuarios (solo ADMIN)

1. Ir a Configuración → **Usuarios**
2. Para crear un usuario: click en **Nuevo Usuario**
3. Completar: nombre, email, rol, contraseña inicial
4. El usuario puede cambiar su contraseña al ingresar

### Roles disponibles

| Rol | Descripción |
|-----|-------------|
| ADMIN | Acceso total, gestión de usuarios |
| PROJECT_MANAGER | Gestión completa de proyectos |
| SUPERVISOR | Seguimiento y actualización de obra |
| ADMINISTRATIVE | Finanzas, gastos y certificaciones |
| READ_ONLY | Solo consulta, sin modificaciones |

### Desactivar un usuario

Desde el listado de usuarios, usar el toggle de estado. Un usuario inactivo no puede iniciar sesión pero sus datos históricos se conservan.

---

## Flujo de trabajo típico en una obra

```
1. Crear proyecto  →  Definir responsable y presupuesto estimado

2. Crear Presupuesto Versionado
   └── Agregar Rubros → Tareas → Ítems con precios
   └── Configurar K (GG, Beneficio, GF, IVA)
   └── Completar APU por ítem si es necesario
   └── Aprobar la versión

3. Crear Plan Financiero
   └── Generar períodos mensuales (manual o en lote)
   └── Distribuir el presupuesto aprobado mes a mes
   └── Aprobar el plan financiero

4. Generar Cronograma desde el presupuesto
   └── Se crean Rubros y Tareas automáticamente

5. Ajustar el plan de trabajo
   └── Agregar fechas planificadas a cada ítem
   └── Asignar empleados
   └── Verificar en el Diagrama Gantt

6. Ejecutar la obra
   └── Registrar gastos imputados al ítem presupuestario correspondiente
   └── Actualizar avance físico de ítems
   └── Registrar asistencia de personal
   └── Emitir certificados de avance al comitente

7. Seguimiento financiero (continuo)
   └── Control Presupuestario: presupuestado vs. certificado vs. gastado real
   └── Plan Financiero: seguimiento de la curva S proyectada vs. real

8. Cierre
   └── Marcar el proyecto como COMPLETED
   └── Generar reporte final
```
