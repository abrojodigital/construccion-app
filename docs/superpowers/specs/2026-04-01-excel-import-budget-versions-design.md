# Importación de Presupuestos desde Excel

**Fecha:** 2026-04-01  
**Estado:** Aprobado  
**Alcance:** Módulo `budget-versions` — backend + frontend

---

## Resumen

Agregar la capacidad de crear una versión de presupuesto (`BudgetVersion`) importando un archivo Excel (.xlsx / .xls) en lugar de cargar los datos manualmente. El flujo incluye una vista previa editable antes de confirmar la creación.

**Datos importados:** ítems del presupuesto + coeficiente K (GG, Beneficio, IVA) + APUs (Análisis de Precios Unitarios) por ítem.

---

## Arquitectura general

```
[Botón "Importar desde Excel" en dialog Nueva Versión]
        ↓
[Selección de archivo .xlsx/.xls]
        ↓
POST /api/v1/budget-versions/import/parse  (multipart, sube el archivo)
        ↓
[API parsea con exceljs → devuelve ParsedBudget JSON]
        ↓
[Frontend muestra vista previa editable: K, categorías, ítems, APUs]
        ↓
[Usuario edita si es necesario]
        ↓
POST /api/v1/budget-versions/import/confirm  (envía JSON confirmado + projectId)
        ↓
[API crea BudgetVersion + BudgetCategory + BudgetStage + BudgetItem + PriceAnalysis en transacción]
```

El módulo de parseo es un archivo independiente `apps/api/src/modules/budget-versions/excel-parser.ts`, separado del servicio para ser testeable de forma aislada.

**Nota sobre bibliotecas:** `exceljs` (ya instalado) no soporta el formato `.xls` (BIFF/Excel 97-2003). Se agrega `xlsx` (SheetJS) como nueva dependencia en `apps/api` — soporta ambos formatos nativamente y es el estándar en Node.js para lectura de Excel. `exceljs` se mantiene para la generación de reportes (uso existente).

---

## Lógica de parseo

### Detección de hoja de ítems
Busca la primera hoja que contenga en alguna fila las palabras "ITEM" o "Descripción" y "Cantidad" y "Unitario". No depende del nombre de la hoja.

### Jerarquía de ítems
Los archivos de ejemplo usan 2 o 3 niveles jerárquicos. La regla de detección:

| Tipo de fila | Criterio | Mapeo DB |
|---|---|---|
| Capítulo | Texto sin cantidad ni precio | `BudgetCategory` |
| Grupo sin precio (ej: `B.1`) | Código con puntos pero sin cantidad/precio | `BudgetStage` (padre de ítems) |
| Ítem con precio (ej: `B.1.1`) | Código + cantidad + precio unitario | `BudgetItem` dentro del `BudgetStage` |
| Ítem directo (ej: `A.1`) | Código con precio, sin grupo padre | `BudgetStage` + `BudgetItem` (el ítem es su propio stage) |

La profundidad se infiere por la cantidad de separadores (`.` o `,`) en el código del ítem.

### Hoja de coeficiente K
Busca hoja cuyo nombre contenga "coeficiente", "K", o "determinacion" (case-insensitive). Extrae GG, Beneficio, IVA buscando esas palabras clave en las filas — no depende de posición fija de columnas.

### Hoja de APUs
Detecta bloques que comienzan con `ITEM:` seguido del código. Por cada bloque extrae:
- **Materiales:** denominación, unidad, cantidad, precio unitario
- **Mano de obra:** categoría, horas, precio horario
- **Transporte / Equipos:** denominación, unidad, cantidad, precio unitario

### Tolerancia a errores
Filas que no se pueden mapear se agregan a `advertencias[]` devuelto junto con el preview. El parseo nunca aborta por filas individuales incorrectas.

---

## Endpoints API

### `POST /api/v1/budget-versions/import/parse`

- **Auth:** requerida — permiso `write` sobre `budget_versions`
- **Body:** `multipart/form-data` — campo `file` (.xlsx / .xls) + campo `projectId`
- **Límite:** 10 MB (heredado del middleware existente)
- **Timeout:** 30 segundos

**Respuesta 200:**
```json
{
  "coeficienteK": {
    "gastosGeneralesPct": 0.1107,
    "beneficioPct": 0.10,
    "gastosFinancierosPct": 0.0,
    "ivaPct": 0.21
  },
  "categories": [
    {
      "number": 1,
      "name": "TRABAJOS PRELIMINARES",
      "stages": [
        {
          "number": "A.1",
          "description": "Cartel de obra",
          "unit": "gl",
          "quantity": 1,
          "unitPrice": 3290527.12,
          "items": [],
          "priceAnalysis": {
            "materials": [{ "description": "...", "unit": "gl", "quantity": 1, "unitCost": 2000000 }],
            "labor": [{ "category": "Oficial", "hours": 4, "hourlyRate": 10022.01 }],
            "transport": [],
            "equipment": []
          }
        }
      ]
    }
  ],
  "advertencias": [
    "Fila 45: no se pudo determinar unidad",
    "Hoja APU: ítem C.1 sin datos de materiales"
  ]
}
```

**Errores:**
- `400` — archivo corrupto o ilegible
- `415` — formato no soportado (no es .xlsx/.xls)
- `422` — no se encontró hoja con estructura de presupuesto válida
- `422` — más de 500 ítems detectados

---

### `POST /api/v1/budget-versions/import/confirm`

- **Auth:** requerida — permiso `write` sobre `budget_versions`
- **Body:** JSON con `projectId`, `name` (nombre de la versión), `description?` + el objeto `ParsedBudget` (posiblemente editado)
- **Operación:** crea en una única transacción Prisma:
  `BudgetVersion` → `BudgetCategory[]` → `BudgetStage[]` → `BudgetItem[]` → `PriceAnalysis[]`
- **Respuesta:** misma forma que el endpoint de creación normal de budget versions
- **Error `422`:** si el JSON confirmado tiene datos inválidos (precio negativo, cantidad vacía, etc.) — se indica el campo específico

---

## Archivos nuevos y modificados

### Backend
| Archivo | Acción |
|---|---|
| `apps/api/src/modules/budget-versions/excel-parser.ts` | Nuevo — lógica de parseo aislada (usa `xlsx` SheetJS) |
| `apps/api/src/modules/budget-versions/budget-versions.service.ts` | Modificado — agregar `importFromParsed()` |
| `apps/api/src/modules/budget-versions/budget-versions.controller.ts` | Modificado — agregar `parseImport()` y `confirmImport()` |
| `apps/api/src/modules/budget-versions/budget-versions.routes.ts` | Modificado — registrar rutas `/import/parse` y `/import/confirm` con multer |
| `packages/shared/src/validators/budget-import.validators.ts` | Nuevo — esquemas Zod para `ParsedBudget` y `ConfirmImportInput` |

### Frontend
| Archivo | Acción |
|---|---|
| `apps/web/src/components/forms/ImportBudgetVersionDialog.tsx` | Nuevo — dialog con los 4 pasos del flujo |
| `apps/web/src/app/(dashboard)/projects/[id]/budget-versions/page.tsx` | Modificado — integrar el nuevo dialog |

---

## UI — Flujo del dialog de importación

El botón "Nueva versión de presupuesto" abre un dialog con dos tabs:
- **"Crear manualmente"** — formulario actual sin cambios
- **"Importar desde Excel"** — flujo nuevo en 4 pasos

### Paso 1 — Selección de archivo
- Dropzone con `<input type="file" accept=".xlsx,.xls">`
- Campo opcional para nombre de la versión (pre-relleno con el nombre del archivo)
- Botón "Analizar archivo"

### Paso 2 — Análisis (loading)
- Spinner con texto "Analizando archivo..."

### Paso 3 — Vista previa editable
- **Banner amarillo colapsable** si hay advertencias
- **Sección Coeficiente K:** campos editables para GG%, Beneficio%, GF%, IVA% — K calculado en tiempo real
- **Sección Ítems:** tabla con columnas Código | Descripción | Unidad | Cantidad | Precio Unit. | Total. Celdas editables inline. Filas de capítulo con fondo diferenciado (no editables en precio/cantidad).
- **Sección APUs:** lista de ítems con APU detectado, expandible por ítem. Solo lectura en el preview (se pueden editar desde la UI normal después de importar).

### Paso 4 — Confirmación
- Botón "Crear versión de presupuesto"
- Spinner mientras procesa
- Al éxito: redirige a la página de la versión creada

---

## Manejo de errores

| Situación | Comportamiento |
|---|---|
| Formato no soportado | Error en frontend antes de subir el archivo |
| Archivo corrupto | API devuelve 400 con mensaje descriptivo |
| Sin estructura válida | API devuelve 422 — "No se encontró una planilla de ítems válida" |
| Más de 500 ítems | API devuelve 422 con límite indicado |
| Ítem con datos incompletos | Incluido en preview con fila en amarillo + en `advertencias[]` |
| Hoja K no encontrada | Valores K en 0, el usuario los completa |
| Hoja APU no encontrada | Se importa sin APUs, sin bloquear |
| JSON inválido en confirm | API devuelve 422 con campo específico; frontend muestra error inline |
| Fallo en transacción BD | Rollback completo — nada queda a medias |

---

## Restricciones y límites

- Máximo 500 ítems por importación
- Archivos hasta 10 MB
- Timeout de parseo: 30 segundos
- Formatos soportados: `.xlsx` (Excel 2007+) y `.xls` (Excel 97-2003)
- Biblioteca de parseo: `xlsx` (SheetJS) — nueva dependencia en `apps/api`, soporta .xlsx y .xls nativamente
- `exceljs` se mantiene para generación de reportes (uso existente), no se usa para el parseo de importación
