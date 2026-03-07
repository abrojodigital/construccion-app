# Guia de Ciclo de Trabajo Completo - Obra Publica Argentina

> Sistema de Gestion ERP para construccion con presupuesto versionado, APU,
> certificaciones formales, subcontrataciones, redeterminacion de precios y multi-moneda.

**Base URL:** `http://localhost:3001/api/v1`
**Credenciales demo:** `admin@constructorademo.com.ar` / `password123`

---

## Indice

1. [Autenticacion](#1-autenticacion)
2. [Crear Proyecto](#2-crear-proyecto)
3. [Presupuesto Versionado (Fase 1)](#3-presupuesto-versionado)
4. [Analisis de Precios Unitarios - APU (Fase 2)](#4-analisis-de-precios-unitarios-apu)
5. [Avance Fisico (Fase 3)](#5-avance-fisico)
6. [Certificacion Formal (Fase 4)](#6-certificacion-formal)
7. [Subcontrataciones (Fase 5)](#7-subcontrataciones)
8. [Redeterminacion de Precios (Fase 6)](#8-redeterminacion-de-precios)
9. [Multi-Moneda (Fase 7)](#9-multi-moneda)
10. [Mapa de Endpoints](#10-mapa-completo-de-endpoints)
11. [Reglas de Negocio](#11-reglas-de-negocio)
12. [Roles y Permisos](#12-roles-y-permisos)

---

## 1. Autenticacion

Todas las operaciones requieren un Bearer token JWT.

```bash
# Login
POST /auth/login
{
  "email": "admin@constructorademo.com.ar",
  "password": "password123"
}

# Respuesta
{
  "success": true,
  "data": {
    "user": { "id": "...", "role": "ADMIN", "organizationId": "..." },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}

# Usar en todas las requests siguientes:
# Authorization: Bearer eyJhbG...
```

---

## 2. Crear Proyecto

```bash
POST /projects
{
  "name": "Ruta Provincial 40 - Tramo Norte",
  "description": "Repavimentacion de 12km de ruta provincial",
  "address": "RP40 km 120-132",
  "city": "Neuquen",
  "province": "Neuquen",
  "status": "PLANNING",
  "startDate": "2026-04-01",
  "estimatedEndDate": "2027-03-31",
  "estimatedBudget": 850000000,
  "managerId": "<id-del-jefe-de-proyecto>"
}
# Respuesta: { data: { id: "proj_xxx", code: "OBR-2026-00001", ... } }
```

---

## 3. Presupuesto Versionado

El presupuesto se organiza en **Version > Capitulos > Items** con Coeficiente K.

### 3.1 Crear version de presupuesto

```bash
POST /projects/{projectId}/budget-versions
{
  "name": "Presupuesto Base v1",
  "description": "Presupuesto original de licitacion",
  "gastosGeneralesPct": 15,
  "beneficioPct": 10,
  "gastosFinancierosPct": 2,
  "ivaPct": 21,
  "projectId": "{projectId}"
}
# Respuesta: { data: { id: "bv_xxx", code: "PRES-2026-00001", status: "DRAFT", ... } }
```

### 3.2 Agregar capitulos

```bash
POST /budget-versions/{budgetVersionId}/chapters
{
  "number": 1,
  "name": "Movimiento de Suelos",
  "description": "Excavaciones, terraplenes y compactacion",
  "order": 1
}

POST /budget-versions/{budgetVersionId}/chapters
{
  "number": 2,
  "name": "Estructura de Pavimento",
  "order": 2
}
```

### 3.3 Agregar items a cada capitulo

```bash
POST /budget-versions/{budgetVersionId}/chapters/{chapterId}/items
{
  "number": "1.1",
  "description": "Excavacion no clasificada",
  "unit": "m3",
  "quantity": 15000,
  "unitPrice": 3500
}

POST /budget-versions/{budgetVersionId}/chapters/{chapterId}/items
{
  "number": "1.2",
  "description": "Terraplen con suelo seleccionado",
  "unit": "m3",
  "quantity": 8000,
  "unitPrice": 4200
}

POST /budget-versions/{budgetVersionId}/chapters/{chapter2Id}/items
{
  "number": "2.1",
  "description": "Sub-base granular e=0.20m",
  "unit": "m2",
  "quantity": 48000,
  "unitPrice": 5800
}
```

### 3.4 Consultar version con totales y K

```bash
GET /budget-versions/{budgetVersionId}
# Respuesta incluye:
# - chapters[].items[] con subtotales
# - totalDirect: suma de todos los items
# - kCoefficient: (1+0.15)*(1+0.10)*(1+0.02)*(1+0.21) = 1.5604...
# - totalWithK: totalDirect * K
```

### 3.5 Recalcular y aprobar

```bash
# Forzar recalculo (util despues de editar items)
POST /budget-versions/{budgetVersionId}/recalculate

# Aprobar la version (cambia DRAFT -> APPROVED)
# Las versiones anteriores APPROVED pasan a SUPERSEDED
POST /budget-versions/{budgetVersionId}/approve
```

**Regla:** Una vez APPROVED, la version NO se puede modificar. Para cambios, crear nueva version.

---

## 4. Analisis de Precios Unitarios (APU)

Cada item del presupuesto puede tener un APU con 6 secciones:
- **A** - Materiales
- **B** - Mano de Obra
- **C** - Transporte
- **D** - Amortizacion de Equipos
- **E** - Reparaciones de Equipos
- **F** - Combustibles y Lubricantes

### 4.1 Crear APU para un item

```bash
POST /budget-items/{budgetItemId}/price-analysis
# Crea un APU vacio con codigo APU-00001
```

### 4.2 Agregar materiales (Seccion A)

```bash
POST /price-analyses/{apuId}/materials
{
  "description": "Cemite Portland",
  "unit": "tn",
  "quantity": 0.35,
  "unitCost": 185000,
  "wastePct": 5
}
# El costo incluye desperdicio: 0.35 * 185000 * 1.05 = 67987.50
```

### 4.3 Agregar mano de obra (Seccion B)

```bash
POST /price-analyses/{apuId}/labor
{
  "category": "Oficial Especializado",
  "quantity": 2,
  "hourlyRate": 4500
}
# Costo: 2 * 4500 = 9000
```

### 4.4 Agregar equipos (Secciones D/E/F)

```bash
POST /price-analyses/{apuId}/equipment
{
  "description": "Retroexcavadora CAT 320",
  "powerHp": 150,
  "newValue": 45000000,
  "amortInterest": 12000,
  "repairsCost": 8000,
  "fuelCost": 15000,
  "lubricantsCost": 2000,
  "hoursUsed": 8,
  "section": "DEF"
}
# hourlyTotal = 12000 + 8000 + 15000 + 2000 = 37000
# totalCost = 37000 * 8 = 296000
# Se desglosa en: D=96000, E=64000, F=136000
```

### 4.5 Agregar transporte (Seccion C)

```bash
POST /price-analyses/{apuId}/transport
{
  "description": "Flete de materiales",
  "unit": "tn-km",
  "quantity": 50,
  "unitCost": 850
}
```

### 4.6 Consultar APU completo

```bash
GET /budget-items/{budgetItemId}/price-analysis
# Respuesta:
# {
#   sectionA: 67987.50,  (materiales)
#   sectionB: 9000.00,   (mano de obra)
#   sectionC: 42500.00,  (transporte)
#   sectionD: 96000.00,  (amortizacion)
#   sectionE: 64000.00,  (reparaciones)
#   sectionF: 136000.00, (combustibles)
#   totalDirect: 415487.50,
#   materials: [...], labor: [...], equipment: [...], transport: [...]
# }
```

**Efecto cascada:** Al agregar sub-items, el sistema recalcula automaticamente:
1. Totales del APU (6 secciones)
2. `unitPrice` del BudgetItem padre
3. Subtotal del capitulo
4. Totales y K de la version completa

---

## 5. Avance Fisico

Registra el progreso real de ejecucion por item de presupuesto.

### 5.1 Registrar avance

```bash
# advance es un valor entre 0 y 1 (0% a 100%)
POST /budget-items/{budgetItemId}/progress
{
  "date": "2026-06-15",
  "advance": 0.25,
  "notes": "Completado primer sector hasta km 123"
}

# Registro posterior
POST /budget-items/{budgetItemId}/progress
{
  "date": "2026-07-15",
  "advance": 0.60,
  "notes": "Avance segundo tramo"
}
```

**Regla:** Si ya existe un registro para la misma fecha, se actualiza (upsert).

### 5.2 Consultar historial

```bash
GET /budget-items/{budgetItemId}/progress
# Retorna todas las entradas ordenadas por fecha desc
```

### 5.3 Resumen de avance de toda la version

```bash
GET /budget-versions/{budgetVersionId}/progress-summary/summary
# Respuesta:
# {
#   overallAdvance: 0.42,
#   totalBudget: 850000000,
#   executedBudget: 357000000,
#   chapters: [
#     {
#       name: "Movimiento de Suelos",
#       advance: 0.55,
#       items: [
#         { description: "Excavacion no clasificada", advance: 0.60, ... },
#         { description: "Terraplen con suelo seleccionado", advance: 0.45, ... }
#       ]
#     },
#     ...
#   ]
# }
```

El avance se pondera por el monto presupuestado de cada item (peso = totalPrice / totalBudget).

---

## 6. Certificacion Formal

El certificado es el documento oficial de avance de obra en licitacion publica argentina.
Incluye deducciones: acopio, anticipo financiero, fondo de reparo e IVA.

### 6.1 Crear certificado

```bash
POST /projects/{projectId}/certificates
{
  "periodStart": "2026-06-01",
  "periodEnd": "2026-06-30",
  "acopioPct": 5,
  "anticipoPct": 20,
  "fondoReparoPct": 5,
  "ivaPct": 21
}
```

**Automaticamente:**
- Toma la version de presupuesto APPROVED del proyecto
- Crea un CertificateItem por cada BudgetItem, copiando: numero, descripcion, unidad, cantidad, precio unitario
- Si hay certificados anteriores, arrastra `previousAdvance` y `previousAmount` acumulados

### 6.2 Cargar avance en cada item del certificado

```bash
PUT /certificates/{certId}/items/{itemId}
{
  "currentAdvance": 0.15
}
# currentAdvance = avance de ESTE periodo (15%)
# totalAdvance = previousAdvance + currentAdvance
# totalAdvance no puede exceder 1.0 (100%)
#
# Automaticamente calcula:
# - currentAmount = currentAdvance * quantity * unitPrice
# - totalAmount = totalAdvance * quantity * unitPrice
# - Recalcula subtotal del certificado
# - Aplica deducciones e IVA
```

### 6.3 Consultar detalle del certificado

```bash
GET /certificates/{certId}
# Respuesta incluye:
# - items[]: cada item con previousAdvance, currentAdvance, totalAdvance, montos
# - subtotal: suma de currentAmount de todos los items
# - acopioAmount, anticipoAmount, fondoReparoAmount: deducciones calculadas
# - adjustmentFactor: factor de redeterminacion (default 1.0)
# - ivaAmount: IVA sobre monto ajustado
# - totalAmount: monto final a cobrar
```

### 6.4 Flujo de estados

```bash
# 1. DRAFT -> SUBMITTED (presentar para aprobacion)
POST /certificates/{certId}/submit

# 2. SUBMITTED -> APPROVED (aprobar - requiere permiso 'approve')
POST /certificates/{certId}/approve

# Solo se puede eliminar en estado DRAFT
DELETE /certificates/{certId}
```

**Regla critica:** Un certificado APPROVED es INMUTABLE. No se puede modificar ni eliminar.

---

## 7. Subcontrataciones

Gestion independiente de subcontratistas con su propio ciclo de certificacion.

### 7.1 Crear subcontratacion

```bash
POST /projects/{projectId}/subcontracts
{
  "name": "Instalacion de senalizacion",
  "description": "Provision y colocacion de senaletica vial",
  "contractorName": "Senalizaciones del Sur SRL",
  "contractorCuit": "30712345678",
  "contactEmail": "info@senalesur.com.ar",
  "startDate": "2026-07-01",
  "endDate": "2026-10-31",
  "totalAmount": 25000000,
  "projectId": "{projectId}"
}
```

### 7.2 Agregar items al subcontrato

```bash
POST /subcontracts/{subcontractId}/items
{
  "description": "Cartel indicador 1.20x0.80m",
  "unit": "u",
  "quantity": 45,
  "unitPrice": 180000,
  "budgetItemId": "{itemId}"  // opcional, vincula con item del presupuesto
}
```

### 7.3 Activar subcontratacion

```bash
# Requiere al menos 1 item
POST /subcontracts/{subcontractId}/activate
# DRAFT -> ACTIVE
```

### 7.4 Certificar al subcontratista

```bash
# Crear certificado (auto-carga items del subcontrato)
POST /subcontracts/{subcontractId}/certificates
{
  "periodStart": "2026-07-01",
  "periodEnd": "2026-07-31"
}

# Cargar avance en cada item
PUT /subcontracts/{subcontractId}/certificates/{certId}/items/{itemId}
{
  "currentAdvance": 0.30
}

# Aprobar (DRAFT -> APPROVED directamente, sin paso SUBMITTED)
POST /subcontracts/{subcontractId}/certificates/{certId}/approve
```

---

## 8. Redeterminacion de Precios

Sistema de ajuste de precios basado en indices oficiales (Dec. 691/16, Res. 1359/20).
Formula polinomica: `Factor = SUM(peso_i * indice_actual_i / indice_base_i)`

### 8.1 Crear indices de precios

```bash
POST /adjustments/indices
{ "name": "Mano de Obra UOCRA", "code": "MO-UOCRA", "source": "INDEC" }

POST /adjustments/indices
{ "name": "Materiales - Cemento", "code": "MAT-CEM", "source": "INDEC" }

POST /adjustments/indices
{ "name": "Equipos Viales", "code": "EQ-VIAL", "source": "CAC" }

POST /adjustments/indices
{ "name": "Combustibles", "code": "COMB-GO", "source": "Secretaria Energia" }
```

### 8.2 Cargar valores mensuales

```bash
# Valores base (mes de licitacion)
POST /adjustments/indices/{moUocraId}/values
{ "date": "2026-03-01", "value": 1000 }

POST /adjustments/indices/{matCemId}/values
{ "date": "2026-03-01", "value": 1000 }

# Valores actuales (6 meses despues)
POST /adjustments/indices/{moUocraId}/values
{ "date": "2026-09-01", "value": 1180 }

POST /adjustments/indices/{matCemId}/values
{ "date": "2026-09-01", "value": 1250 }
```

### 8.3 Crear formula polinomica

```bash
POST /adjustments/formulas
{
  "name": "Formula Tipo - Pavimentacion",
  "budgetVersionId": "{budgetVersionId}",
  "weights": [
    { "component": "Mano de Obra", "weight": 0.35, "priceIndexId": "{moUocraId}" },
    { "component": "Materiales", "weight": 0.30, "priceIndexId": "{matCemId}" },
    { "component": "Equipos", "weight": 0.20, "priceIndexId": "{eqVialId}" },
    { "component": "Combustibles", "weight": 0.15, "priceIndexId": "{combGoId}" }
  ]
}
```

**Regla:** La suma de pesos debe ser exactamente 1.0.

### 8.4 Calcular factor de ajuste

```bash
POST /adjustments/calculate
{
  "formulaId": "{formulaId}",
  "baseDate": "2026-03-01",
  "currentDate": "2026-09-01"
}
# Respuesta:
# {
#   factor: 1.1875,
#   variationPct: 18.75,
#   details: [
#     { component: "Mano de Obra", weight: 0.35, baseValue: 1000, currentValue: 1180, ratio: 1.18, contribution: 0.413 },
#     { component: "Materiales", weight: 0.30, baseValue: 1000, currentValue: 1250, ratio: 1.25, contribution: 0.375 },
#     ...
#   ]
# }
```

El `factor` resultante se puede aplicar al `adjustmentFactor` del certificado para redeterminar precios.

---

## 9. Multi-Moneda

Soporte para multiples monedas con conversion automatica.

### 9.1 Crear monedas

```bash
POST /currencies
{ "code": "ARS", "name": "Peso Argentino", "symbol": "$" }

POST /currencies
{ "code": "USD", "name": "Dolar Estadounidense", "symbol": "US$" }
```

### 9.2 Cargar tipos de cambio

```bash
POST /currencies/exchange-rates
{
  "fromCurrencyId": "{usdId}",
  "toCurrencyId": "{arsId}",
  "date": "2026-09-15",
  "rate": 1250.50,
  "source": "BCRA"
}
```

### 9.3 Consultar ultimo tipo de cambio

```bash
GET /currencies/exchange-rates/latest/{fromCurrencyId}/{toCurrencyId}
# Opcional: ?date=2026-09-01 para una fecha especifica
```

### 9.4 Convertir montos

```bash
POST /currencies/convert
{
  "amount": 50000,
  "fromCurrencyId": "{usdId}",
  "toCurrencyId": "{arsId}"
}
# Respuesta: { amount: 50000, convertedAmount: 62525000, rate: 1250.50 }
```

**Caracteristica:** Si no existe tipo de cambio directo, el sistema intenta la conversion inversa automaticamente.

---

## 10. Mapa Completo de Endpoints

### Autenticacion
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/auth/login` | Iniciar sesion |
| POST | `/auth/register` | Registrar usuario |
| POST | `/auth/refresh` | Renovar token |

### Proyectos
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/projects` | Crear proyecto |
| GET | `/projects` | Listar proyectos |
| GET | `/projects/:id` | Detalle de proyecto |
| PUT | `/projects/:id` | Actualizar proyecto |
| DELETE | `/projects/:id` | Eliminar proyecto |

### Presupuesto Versionado
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/projects/:projectId/budget-versions` | Crear version |
| GET | `/projects/:projectId/budget-versions` | Listar versiones |
| GET | `/budget-versions/:id` | Detalle con capitulos e items |
| PUT | `/budget-versions/:id` | Editar version (DRAFT) |
| DELETE | `/budget-versions/:id` | Eliminar version |
| POST | `/budget-versions/:id/approve` | Aprobar version |
| POST | `/budget-versions/:id/recalculate` | Recalcular K y totales |
| POST | `/budget-versions/:id/chapters` | Crear capitulo |
| PUT | `/budget-versions/:id/chapters/:chapterId` | Editar capitulo |
| DELETE | `/budget-versions/:id/chapters/:chapterId` | Eliminar capitulo |
| POST | `/budget-versions/:id/chapters/:chapterId/items` | Crear item |
| PUT | `/budget-versions/:id/items/:itemId` | Editar item |
| DELETE | `/budget-versions/:id/items/:itemId` | Eliminar item |

### APU (Analisis de Precios Unitarios)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/budget-items/:budgetItemId/price-analysis` | Obtener APU |
| POST | `/budget-items/:budgetItemId/price-analysis` | Crear APU |
| DELETE | `/price-analyses/:id` | Eliminar APU |
| POST | `/price-analyses/:id/materials` | Agregar material |
| POST | `/price-analyses/:id/labor` | Agregar mano de obra |
| POST | `/price-analyses/:id/equipment` | Agregar equipo |
| POST | `/price-analyses/:id/transport` | Agregar transporte |
| DELETE | `/price-analyses/:id/:type/:itemId` | Eliminar sub-item |

### Avance Fisico
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/budget-items/:budgetItemId/progress` | Registrar avance |
| GET | `/budget-items/:budgetItemId/progress` | Historial de avance |
| DELETE | `/progress/:id` | Eliminar entrada |
| GET | `/budget-versions/:id/progress-summary/summary` | Resumen ponderado |

### Certificaciones
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/projects/:projectId/certificates` | Crear certificado |
| GET | `/projects/:projectId/certificates` | Listar certificados |
| GET | `/certificates/:id` | Detalle con items |
| PUT | `/certificates/:id/items/:itemId` | Actualizar avance item |
| POST | `/certificates/:id/submit` | Presentar (DRAFT->SUBMITTED) |
| POST | `/certificates/:id/approve` | Aprobar (SUBMITTED->APPROVED) |
| DELETE | `/certificates/:id` | Eliminar (solo DRAFT) |

### Subcontrataciones
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/projects/:projectId/subcontracts` | Crear subcontrato |
| GET | `/projects/:projectId/subcontracts` | Listar subcontratos |
| GET | `/subcontracts/:id` | Detalle completo |
| PUT | `/subcontracts/:id` | Actualizar (DRAFT) |
| DELETE | `/subcontracts/:id` | Eliminar (DRAFT) |
| POST | `/subcontracts/:id/activate` | Activar (DRAFT->ACTIVE) |
| POST | `/subcontracts/:id/items` | Agregar item |
| DELETE | `/subcontracts/:id/items/:itemId` | Eliminar item |
| POST | `/subcontracts/:id/certificates` | Crear certificado |
| PUT | `/subcontracts/:id/certificates/:certId/items/:itemId` | Avance item |
| POST | `/subcontracts/:id/certificates/:certId/approve` | Aprobar cert. |

### Redeterminacion de Precios
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/adjustments/indices` | Crear indice |
| GET | `/adjustments/indices` | Listar indices |
| GET | `/adjustments/indices/:id` | Indice con valores |
| POST | `/adjustments/indices/:id/values` | Agregar valor |
| DELETE | `/adjustments/indices/:id` | Eliminar indice |
| POST | `/adjustments/formulas` | Crear formula |
| GET | `/adjustments/formulas` | Listar formulas |
| GET | `/adjustments/formulas/:id` | Detalle formula |
| DELETE | `/adjustments/formulas/:id` | Eliminar formula |
| POST | `/adjustments/calculate` | Calcular factor |

### Multi-Moneda
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/currencies` | Crear moneda |
| GET | `/currencies` | Listar monedas |
| GET | `/currencies/:id` | Detalle con tipos de cambio |
| DELETE | `/currencies/:id` | Eliminar moneda |
| POST | `/currencies/exchange-rates` | Agregar tipo de cambio |
| GET | `/currencies/exchange-rates` | Listar tipos de cambio |
| GET | `/currencies/exchange-rates/latest/:from/:to` | Ultimo TC |
| DELETE | `/currencies/exchange-rates/:id` | Eliminar TC |
| POST | `/currencies/convert` | Convertir monto |

---

## 11. Reglas de Negocio

### Inmutabilidad
- **Certificados APPROVED** no se pueden modificar ni eliminar
- **Versiones de presupuesto APPROVED** no se pueden editar (crear nueva version)
- La redeterminacion es **no retroactiva**: solo afecta certificados futuros

### Ciclos de Estado

```
Version de Presupuesto:
  DRAFT ──(aprobar)──> APPROVED ──(nueva version aprobada)──> SUPERSEDED

Certificado de Obra:
  DRAFT ──(presentar)──> SUBMITTED ──(aprobar)──> APPROVED ──(pagar)──> PAID

Subcontratacion:
  DRAFT ──(activar)──> ACTIVE ──(completar)──> COMPLETED
                                ──(cancelar)──> CANCELLED

Certificado de Subcontrato:
  DRAFT ──(aprobar)──> APPROVED (sin paso intermedio SUBMITTED)
```

### Calculos Automaticos

1. **APU -> BudgetItem -> BudgetVersion**: Al modificar cualquier sub-item del APU,
   el precio unitario del item se recalcula, luego el subtotal del capitulo, luego
   los totales de la version incluyendo el Coeficiente K.

2. **Certificado**: Al actualizar el avance de un item, se recalculan montos del item,
   subtotal del certificado, deducciones, factor de ajuste, IVA y total.

3. **Coeficiente K**: `K = (1 + GG%) * (1 + Ben%) * (1 + GF%) * (1 + IVA%)`

4. **Avance ponderado**: El avance global se calcula como promedio ponderado
   por monto presupuestado de cada item.

### Validaciones de Avance
- `currentAdvance` debe ser >= 0
- `totalAdvance = previousAdvance + currentAdvance` no puede exceder 1.0
- Los porcentajes de deduccion deben ser >= 0
- La suma de pesos en una formula polinomica debe ser exactamente 1.0

### Multi-tenancy
- **Todas** las queries filtran por `organizationId` del usuario autenticado
- Un usuario NUNCA puede ver datos de otra organizacion
- Los codigos auto-generados son secuenciales **por organizacion**

### Soft Deletes
- Proyectos, versiones, certificados, subcontratos usan `deletedAt`
- Las queries filtran automaticamente `deletedAt: null`

---

## 12. Roles y Permisos

| Recurso | ADMIN | PROJECT_MANAGER | SUPERVISOR | ADMINISTRATIVE | READ_ONLY |
|---------|-------|-----------------|------------|----------------|-----------|
| budget_versions | RWDA | RWA | RW | R | R |
| price_analysis | RWD | RW | RW | R | R |
| progress | RWD | RW | RW | R | R |
| certificates | RWDA | RWA | RW | R | R |
| subcontracts | RWDA | RWA | R | R | R |
| adjustments | RWD | RW | R | R | R |
| currencies | RWD | R | R | R | R |

**Leyenda:** R=Read, W=Write, D=Delete, A=Approve

### Permisos Especiales
- **Aprobar certificados**: Solo ADMIN y PROJECT_MANAGER
- **Aprobar presupuestos**: Solo ADMIN y PROJECT_MANAGER
- **Crear/editar monedas**: Solo ADMIN
- **Crear indices de precios**: ADMIN y PROJECT_MANAGER

---

## Ciclo Completo Resumido

```
1. LOGIN ──> Token JWT

2. PROYECTO
   POST /projects

3. PRESUPUESTO
   POST /projects/{id}/budget-versions
   POST /budget-versions/{id}/chapters (x N)
   POST /budget-versions/{id}/chapters/{id}/items (x N)

4. APU (para cada item que lo requiera)
   POST /budget-items/{id}/price-analysis
   POST /price-analyses/{id}/materials
   POST /price-analyses/{id}/labor
   POST /price-analyses/{id}/equipment
   POST /price-analyses/{id}/transport

5. APROBAR PRESUPUESTO
   POST /budget-versions/{id}/approve

6. AVANCE FISICO (periodico, durante la obra)
   POST /budget-items/{id}/progress
   GET  /budget-versions/{id}/progress-summary/summary

7. CERTIFICACION (mensual/quincenal)
   POST /projects/{id}/certificates
   PUT  /certificates/{id}/items/{itemId} (x N items)
   POST /certificates/{id}/submit
   POST /certificates/{id}/approve

8. SUBCONTRATACIONES (si aplica)
   POST /projects/{id}/subcontracts
   POST /subcontracts/{id}/items (x N)
   POST /subcontracts/{id}/activate
   POST /subcontracts/{id}/certificates
   PUT  /subcontracts/{id}/certificates/{certId}/items/{itemId}
   POST /subcontracts/{id}/certificates/{certId}/approve

9. REDETERMINACION (cuando hay variacion de precios)
   POST /adjustments/indices + /values (cargar datos INDEC)
   POST /adjustments/formulas
   POST /adjustments/calculate ──> factor
   (aplicar factor al siguiente certificado)

10. MULTI-MONEDA (si hay insumos importados)
    POST /currencies + /exchange-rates
    POST /currencies/convert
```

---

## Motor de Calculo (Referencia Tecnica)

El sistema incluye un motor de calculo centralizado en `apps/api/src/engine/` con funciones
puras y stateless, importables desde cualquier modulo:

```typescript
import {
  // Costos y K
  calculateKCoefficient,
  calculateItemTotal,
  calculateAPUSummary,

  // Certificaciones
  calculateCertificateItem,
  calculateCertificateDeductions,
  calculateWeightedAdvance,

  // Redeterminacion
  calculateAdjustmentFactor,
  applyAdjustmentFactor,

  // Financiero
  calculateBudgetVsExecuted,
  calculateProjectIndicators,
  convertCurrency,
} from '../engine';
```

Indicadores disponibles:
- **CPI** (Cost Performance Index): valor ganado / costo real
- **SPI** (Schedule Performance Index): avance real / avance planificado
- **EAC** (Estimate at Completion): costo final proyectado
- **Desviacion presupuestaria**: (gastos - certificado) / presupuesto total
