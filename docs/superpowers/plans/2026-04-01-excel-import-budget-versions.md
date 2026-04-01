# Importación de Presupuestos desde Excel — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir crear una `BudgetVersion` completa importando un archivo .xlsx o .xls que contenga ítems del presupuesto, coeficiente K y APUs.

**Architecture:** Dos endpoints nuevos en el módulo `budget-versions`: `POST /import/parse` (recibe el archivo, devuelve JSON preview) y `POST /import/confirm` (recibe el JSON editado, crea todas las entidades en secuencia con rollback). El frontend muestra una vista previa editable en un dialog con tabs.

**Tech Stack:** `xlsx` (SheetJS) para parseo de .xlsx y .xls, `multer` (memoryStorage) para recepción del archivo, Zod para validación del JSON confirmado, Tabs de Radix UI en el frontend.

---

## Archivos a crear o modificar

| Acción | Archivo |
|---|---|
| **Crear** | `apps/api/src/modules/budget-versions/excel-parser.ts` |
| **Crear** | `apps/api/src/modules/budget-versions/__tests__/excel-parser.test.ts` |
| **Modificar** | `packages/shared/src/validators/index.ts` (agregar schemas al final) |
| **Modificar** | `apps/api/src/modules/budget-versions/budget-versions.service.ts` (agregar `importFromParsed`) |
| **Modificar** | `apps/api/src/modules/budget-versions/budget-versions.controller.ts` (agregar `parseImport`, `confirmImport`) |
| **Modificar** | `apps/api/src/modules/budget-versions/budget-versions.routes.ts` (agregar rutas + multer) |
| **Crear** | `apps/web/src/components/forms/import-budget-version-dialog.tsx` |
| **Modificar** | `apps/web/src/app/(dashboard)/projects/[id]/budget-versions/page.tsx` (tabs en dialog) |

---

## Task 1: Instalar xlsx y agregar schemas Zod al paquete shared

**Files:**
- Modify: `apps/api/package.json`
- Modify: `packages/shared/src/validators/index.ts`

- [ ] **Step 1: Instalar xlsx en apps/api**

```bash
cd apps/api && pnpm add xlsx
```

Expected: `apps/api/package.json` tiene `"xlsx": "..."` en `dependencies`.

- [ ] **Step 2: Agregar tipos y schemas Zod al final de packages/shared/src/validators/index.ts**

Agregar al final del archivo (después de todo el contenido existente):

```typescript
// ============================================
// IMPORTACIÓN DESDE EXCEL
// ============================================

export const parsedAnalysisMaterialSchema = z.object({
  description: z.string().min(1),
  unit: z.string().default('gl'),
  quantity: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
});

export const parsedAnalysisLaborSchema = z.object({
  category: z.string().min(1),
  quantity: z.number().nonnegative(),
  hourlyRate: z.number().nonnegative(),
});

export const parsedAnalysisTransportSchema = z.object({
  description: z.string().min(1),
  unit: z.string().default('gl'),
  quantity: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
});

export const parsedPriceAnalysisSchema = z.object({
  materials: z.array(parsedAnalysisMaterialSchema),
  labor: z.array(parsedAnalysisLaborSchema),
  transport: z.array(parsedAnalysisTransportSchema),
});

export const parsedBudgetItemSchema = z.object({
  number: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().default('gl'),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  priceAnalysis: parsedPriceAnalysisSchema.optional(),
});

export const parsedBudgetStageSchema = z.object({
  number: z.string().min(1),
  description: z.string().min(1),
  unit: z.string().default('gl'),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  items: z.array(parsedBudgetItemSchema),
  priceAnalysis: parsedPriceAnalysisSchema.optional(),
});

export const parsedBudgetCategorySchema = z.object({
  number: z.number().int().positive(),
  name: z.string().min(1),
  stages: z.array(parsedBudgetStageSchema),
});

export const parsedCoeficienteKSchema = z.object({
  gastosGeneralesPct: z.number().min(0).max(1),
  beneficioPct: z.number().min(0).max(1),
  gastosFinancierosPct: z.number().min(0).max(1),
  ivaPct: z.number().min(0).max(1),
});

export const parsedBudgetSchema = z.object({
  coeficienteK: parsedCoeficienteKSchema,
  categories: z.array(parsedBudgetCategorySchema),
  advertencias: z.array(z.string()),
});

export const confirmImportSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().max(500).optional(),
  parsedBudget: parsedBudgetSchema,
});

export type ParsedBudget = z.infer<typeof parsedBudgetSchema>;
export type ParsedBudgetCategory = z.infer<typeof parsedBudgetCategorySchema>;
export type ParsedBudgetStage = z.infer<typeof parsedBudgetStageSchema>;
export type ParsedBudgetItem = z.infer<typeof parsedBudgetItemSchema>;
export type ParsedPriceAnalysis = z.infer<typeof parsedPriceAnalysisSchema>;
export type ParsedCoeficienteK = z.infer<typeof parsedCoeficienteKSchema>;
export type ConfirmImportInput = z.infer<typeof confirmImportSchema>;
```

- [ ] **Step 3: Verificar typecheck del paquete shared**

```bash
pnpm --filter @construccion/shared typecheck
```

Expected: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/validators/index.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat: agregar schemas Zod para importación de presupuesto desde Excel"
```

---

## Task 2: Implementar excel-parser.ts

**Files:**
- Create: `apps/api/src/modules/budget-versions/excel-parser.ts`

- [ ] **Step 1: Crear apps/api/src/modules/budget-versions/excel-parser.ts**

```typescript
import * as XLSX from 'xlsx';
import type {
  ParsedBudget,
  ParsedBudgetCategory,
  ParsedBudgetStage,
  ParsedBudgetItem,
  ParsedPriceAnalysis,
  ParsedCoeficienteK,
} from '@construccion/shared';

const MAX_ITEMS = 500;

// ============================================
// Helpers internos
// ============================================

interface ColumnMap {
  codeCol: number;
  descCol: number;
  unitCol: number;
  qtyCol: number;
  priceCol: number;
}

function rowText(row: any[]): string {
  return row.map((c) => String(c ?? '').toLowerCase()).join(' ');
}

function getCodeDepth(code: string): number {
  return (code.match(/[.,]/g) ?? []).length;
}

// ============================================
// Detección de columnas
// ============================================

function findHeaderRow(rows: any[][]): { rowIdx: number; cols: ColumnMap } | null {
  for (let r = 0; r < Math.min(25, rows.length); r++) {
    const row = rows[r] ?? [];
    const combined = [...row, ...(rows[r + 1] ?? [])];
    const len = row.length;

    if (!combined.some((c) => String(c ?? '').toLowerCase().includes('cantidad'))) continue;

    const findCol = (keywords: string[]): number => {
      for (const kw of keywords) {
        const idx = combined.findIndex((c) => String(c ?? '').toLowerCase().includes(kw));
        if (idx !== -1) return idx >= len ? idx - len : idx;
      }
      return -1;
    };

    const qtyCol = findCol(['cantidad']);
    if (qtyCol === -1) continue;

    const descCol = findCol(['descripci', 'designa', 'denominaci']);
    const unitCol = findCol(['unidad']);
    const codeCol = findCol(['item', '° item', 'nro', 'n° ']);
    const priceCol = findCol(['unitario']);

    if (qtyCol !== -1 && (descCol !== -1 || unitCol !== -1)) {
      const safeUnit = unitCol !== -1 ? unitCol : qtyCol - 1;
      const safeDesc = descCol !== -1 ? descCol : Math.max(0, safeUnit - 1);
      const safeCode = codeCol !== -1 ? codeCol : Math.max(0, safeDesc - 1);
      const safePrice = priceCol !== -1 ? priceCol : qtyCol + 1;

      return {
        rowIdx: r,
        cols: {
          codeCol: Math.max(0, safeCode),
          descCol: Math.max(0, safeDesc),
          unitCol: Math.max(0, safeUnit),
          qtyCol,
          priceCol: Math.max(0, safePrice),
        },
      };
    }
  }
  return null;
}

// ============================================
// Detección de hojas
// ============================================

function findItemsSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (findHeaderRow(rows)) return ws;
  }
  return null;
}

function findKSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  for (const name of wb.SheetNames) {
    const lower = name.toLowerCase();
    if (lower === 'k' || lower.includes('determinaci') || lower.includes('coeficiente')) {
      return wb.Sheets[name];
    }
  }
  return null;
}

function findApuSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  for (const name of wb.SheetNames) {
    const lower = name.toLowerCase();
    if (lower.includes('anális') || lower.includes('analisis') || lower === 'apu') {
      return wb.Sheets[name];
    }
  }
  // Fallback: buscar por contenido
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    for (const row of rows.slice(0, 15)) {
      const t = rowText(row);
      if (t.includes('item:') || t.includes('análisis de precios')) return ws;
    }
  }
  return null;
}

// ============================================
// Parseo de coeficiente K
// ============================================

function parseKSheet(ws: XLSX.WorkSheet): ParsedCoeficienteK {
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const result: ParsedCoeficienteK = {
    gastosGeneralesPct: 0,
    beneficioPct: 0,
    gastosFinancierosPct: 0,
    ivaPct: 0,
  };

  for (const row of rows) {
    const text = rowText(row);
    const numVal = row.find((c: any) => typeof c === 'number' && c > 0 && c < 1);
    if (numVal === undefined) continue;

    if (text.includes('gastos generales') || (text.includes('gg') && !text.includes('beneficio'))) {
      result.gastosGeneralesPct = numVal;
    } else if (text.includes('beneficio')) {
      result.beneficioPct = numVal;
    } else if (text.includes('gastos financ') || (text.includes(' gf') && !text.includes('iva'))) {
      result.gastosFinancierosPct = numVal;
    } else if (text.includes('iva')) {
      result.ivaPct = numVal;
    }
  }

  return result;
}

// ============================================
// Parseo de APUs
// ============================================

function parseApuSheet(ws: XLSX.WorkSheet): Map<string, ParsedPriceAnalysis> {
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const apuMap = new Map<string, ParsedPriceAnalysis>();

  let currentCode: string | null = null;
  let currentApu: ParsedPriceAnalysis | null = null;
  type Section = 'materials' | 'labor' | 'transport' | null;
  let section: Section = null;

  const saveApu = () => {
    if (currentCode && currentApu) apuMap.set(currentCode, currentApu);
  };

  for (const row of rows) {
    const text = rowText(row);

    // Detectar bloque ITEM:
    const itemCell = row.find((c: any) => String(c ?? '').toUpperCase().includes('ITEM:'));
    if (itemCell) {
      saveApu();
      const idx = row.indexOf(itemCell);
      currentCode = String(row[idx + 1] ?? '').trim() || String(itemCell).replace(/item:/i, '').trim();
      currentApu = { materials: [], labor: [], transport: [] };
      section = null;
      continue;
    }

    if (!currentApu) continue;

    // Detectar secciones
    if (text.match(/a\)\s*material/) || (text.includes('material') && !text.includes('sub'))) {
      if (!text.includes('denominaci') && !text.includes('total')) { section = 'materials'; continue; }
    }
    if (text.match(/b\)\s*mano/) || text.includes('mano de obra')) {
      if (!text.includes('categoría') && !text.includes('total')) { section = 'labor'; continue; }
    }
    if (text.match(/c\)\s*transport/) || (text.includes('transport') && !text.includes('total'))) {
      if (!text.includes('denominaci')) { section = 'transport'; continue; }
    }
    // Saltear cabeceras de columna y subtotales
    if (
      text.includes('denominaci') ||
      text.includes('categoría') ||
      text.includes('categoria') ||
      text.includes('sub total') ||
      text.includes('subtotal') ||
      text.includes('total') ||
      text.includes('unidad') ||
      !section
    ) continue;

    // Filas de datos según sección
    const descIdx = row.findIndex(
      (c: any, i: number) => i > 0 && typeof c === 'string' && c.trim().length > 1
    );
    if (descIdx === -1) continue;

    if (section === 'materials') {
      const desc = String(row[descIdx]).trim();
      const unit = String(row[descIdx + 1] ?? 'gl').trim() || 'gl';
      const nums = (row as any[]).filter((c) => typeof c === 'number' && c > 0);
      if (nums.length < 2) continue;
      currentApu.materials.push({ description: desc, unit, quantity: nums[0], unitCost: nums[1] });
    } else if (section === 'labor') {
      const category = String(row[descIdx]).trim();
      const nums = (row as any[]).filter((c) => typeof c === 'number' && c > 0);
      if (nums.length < 2) continue;
      currentApu.labor.push({ category, quantity: nums[0], hourlyRate: nums[1] });
    } else if (section === 'transport') {
      const desc = String(row[descIdx]).trim();
      const unit = String(row[descIdx + 1] ?? 'gl').trim() || 'gl';
      const nums = (row as any[]).filter((c) => typeof c === 'number' && c > 0);
      if (nums.length < 2) continue;
      currentApu.transport.push({ description: desc, unit, quantity: nums[0], unitCost: nums[1] });
    }
  }

  saveApu();
  return apuMap;
}

// ============================================
// Parseo de ítems
// ============================================

function parseItemsSheet(
  ws: XLSX.WorkSheet,
  apuMap: Map<string, ParsedPriceAnalysis>
): { categories: ParsedBudgetCategory[]; advertencias: string[] } {
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const headerInfo = findHeaderRow(rows);
  if (!headerInfo) return { categories: [], advertencias: ['No se encontró fila de encabezados'] };

  const { rowIdx, cols } = headerInfo;
  const dataRows = rows.slice(rowIdx + 1);
  const categories: ParsedBudgetCategory[] = [];
  const advertencias: string[] = [];
  let catNumber = 0;

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r] ?? [];
    if (row.every((c) => c == null || c === '')) continue;

    const code = String(row[cols.codeCol] ?? '').trim();
    const desc = String(row[cols.descCol] ?? '').trim();
    if (!code && !desc) continue;

    const label = desc || code;
    const labelLower = label.toLowerCase();
    if (labelLower.includes('subtotal') || labelLower === 'total') continue;

    const qty = typeof row[cols.qtyCol] === 'number' ? (row[cols.qtyCol] as number) : 0;
    const price = typeof row[cols.priceCol] === 'number' ? (row[cols.priceCol] as number) : 0;
    const unit = String(row[cols.unitCol] ?? '').trim() || 'gl';
    const hasPrice = qty > 0 && price > 0;
    const depth = code ? getCodeDepth(code) : 0;

    if (!hasPrice && depth === 0) {
      // Capítulo
      catNumber++;
      categories.push({ number: catNumber, name: label, stages: [] });
    } else if (!hasPrice && depth > 0) {
      // Grupo sin precio (cabecera de etapa)
      if (categories.length === 0) {
        catNumber++;
        categories.push({ number: catNumber, name: 'Sin categoría', stages: [] });
        advertencias.push(`Ítem "${code}" sin capítulo padre — asignado a categoría implícita`);
      }
      categories[categories.length - 1].stages.push({
        number: code || String(categories[categories.length - 1].stages.length + 1),
        description: label,
        unit: 'gl',
        quantity: 0,
        unitPrice: 0,
        items: [],
      });
    } else if (hasPrice) {
      // Ítem con precio
      if (categories.length === 0) {
        catNumber++;
        categories.push({ number: catNumber, name: 'Sin categoría', stages: [] });
        advertencias.push(`Ítem "${code}" sin capítulo padre — asignado a categoría implícita`);
      }
      const cat = categories[categories.length - 1];
      const lastStage = cat.stages[cat.stages.length - 1];

      if (lastStage && depth > getCodeDepth(lastStage.number)) {
        // Sub-ítem de la última etapa
        lastStage.items.push({
          number: code || String(lastStage.items.length + 1),
          description: label,
          unit,
          quantity: qty,
          unitPrice: price,
          priceAnalysis: apuMap.get(code) ?? undefined,
        });
      } else {
        // Etapa hoja (sin sub-ítems)
        cat.stages.push({
          number: code || String(cat.stages.length + 1),
          description: label,
          unit,
          quantity: qty,
          unitPrice: price,
          items: [],
          priceAnalysis: apuMap.get(code) ?? undefined,
        });
      }
    }
  }

  return { categories, advertencias };
}

// ============================================
// Función principal exportada
// ============================================

export function parseBuffer(buffer: Buffer): ParsedBudget {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const advertencias: string[] = [];

  const apuSheet = findApuSheet(wb);
  const apuMap = apuSheet ? parseApuSheet(apuSheet) : new Map<string, ParsedPriceAnalysis>();

  const itemsSheet = findItemsSheet(wb);
  if (!itemsSheet) {
    throw new Error('No se encontró una planilla de ítems válida en el archivo');
  }

  const { categories, advertencias: itemAdv } = parseItemsSheet(itemsSheet, apuMap);
  advertencias.push(...itemAdv);

  const kSheet = findKSheet(wb);
  const coeficienteK = kSheet
    ? parseKSheet(kSheet)
    : { gastosGeneralesPct: 0, beneficioPct: 0, gastosFinancierosPct: 0, ivaPct: 0 };

  if (!kSheet) {
    advertencias.push('No se encontró la hoja de Coeficiente K. Los valores se inicializaron en 0.');
  }

  const totalItems = categories
    .flatMap((c) => c.stages)
    .reduce((sum, s) => sum + Math.max(1, s.items.length), 0);

  if (totalItems > MAX_ITEMS) {
    throw new Error(`El archivo tiene ${totalItems} ítems. El límite es ${MAX_ITEMS}.`);
  }

  return { coeficienteK, categories, advertencias };
}

// Exportar helpers para tests
export {
  findHeaderRow,
  parseKSheet,
  parseApuSheet,
  parseItemsSheet,
  findItemsSheet,
  findKSheet,
  findApuSheet,
  getCodeDepth,
};
```

- [ ] **Step 2: Verificar typecheck**

```bash
pnpm --filter @construccion/api typecheck
```

Expected: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/budget-versions/excel-parser.ts
git commit -m "feat: implementar excel-parser para importación de presupuestos"
```

---

## Task 3: Tests para excel-parser.ts

**Files:**
- Create: `apps/api/src/modules/budget-versions/__tests__/excel-parser.test.ts`

- [ ] **Step 1: Escribir el archivo de tests**

```typescript
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  findHeaderRow,
  parseKSheet,
  parseApuSheet,
  parseItemsSheet,
  getCodeDepth,
  parseBuffer,
} from '../excel-parser';

// ============================================
// Helpers para crear workbooks en memoria
// ============================================

function makeSheet(data: any[][]): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet(data);
}

function makeWorkbook(sheets: Record<string, any[][]>): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  for (const [name, data] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, makeSheet(data), name);
  }
  return wb;
}

// ============================================
// getCodeDepth
// ============================================

describe('getCodeDepth', () => {
  it('returns 0 for codes with no separators', () => {
    expect(getCodeDepth('RUBRO A')).toBe(0);
    expect(getCodeDepth('10')).toBe(0);
  });

  it('returns 1 for codes with one separator', () => {
    expect(getCodeDepth('A.1')).toBe(1);
    expect(getCodeDepth('10,1')).toBe(1);
  });

  it('returns 2 for codes with two separators', () => {
    expect(getCodeDepth('B.1.1')).toBe(2);
  });
});

// ============================================
// findHeaderRow
// ============================================

describe('findHeaderRow', () => {
  it('detects header row with standard columns', () => {
    const rows = [
      ['', '', 'ITEM', 'DESCRIPCIÓN', 'Unidad', 'Cantidad', 'Precio Unitario', 'Total'],
    ];
    const result = findHeaderRow(rows);
    expect(result).not.toBeNull();
    expect(result!.rowIdx).toBe(0);
    expect(result!.cols.qtyCol).toBe(5);
    expect(result!.cols.descCol).toBe(3);
    expect(result!.cols.unitCol).toBe(4);
  });

  it('detects header split across two rows', () => {
    const rows = [
      ['', 'N° Item', 'Designación', 'Unidad', 'Cantidad', 'Precio', '', '$'],
      ['', '', '', '', '', 'Unitario', 'Parcial', 'item'],
    ];
    const result = findHeaderRow(rows);
    expect(result).not.toBeNull();
    expect(result!.cols.priceCol).toBe(5);
  });

  it('returns null when no header is found', () => {
    const rows = [
      ['Nombre', 'Fecha'],
      ['Juan', '2024-01-01'],
    ];
    expect(findHeaderRow(rows)).toBeNull();
  });
});

// ============================================
// parseKSheet
// ============================================

describe('parseKSheet', () => {
  it('extrae GG, Beneficio, IVA correctamente', () => {
    const ws = makeSheet([
      ['', 'DETERMINACIÓN DEL COEFICIENTE K'],
      ['', 'Gastos Generales', 0.11, '(% de II)'],
      ['', 'Beneficio', 0.10, '(% de III)'],
      ['', 'IVA', 0.21, '(% de IV)'],
    ]);
    const result = parseKSheet(ws);
    expect(result.gastosGeneralesPct).toBe(0.11);
    expect(result.beneficioPct).toBe(0.10);
    expect(result.ivaPct).toBe(0.21);
    expect(result.gastosFinancierosPct).toBe(0);
  });

  it('retorna ceros cuando no hay datos', () => {
    const ws = makeSheet([['Datos', 'sin', 'porcentajes']]);
    const result = parseKSheet(ws);
    expect(result.gastosGeneralesPct).toBe(0);
    expect(result.beneficioPct).toBe(0);
    expect(result.ivaPct).toBe(0);
  });
});

// ============================================
// parseApuSheet
// ============================================

describe('parseApuSheet', () => {
  it('parsea un bloque APU con materiales y mano de obra', () => {
    const ws = makeSheet([
      ['', '', 'ANÁLISIS DE PRECIOS'],
      ['', '', 'ITEM:', 'A.1', 'Cartel de obra'],
      ['', '', 'A) MATERIALES'],
      ['', '', 'DENOMINACIÓN', 'UNIDAD', 'CANTIDAD', 'C. UNITARIO', 'TOTAL'],
      ['', '', 'Cartel metálico', 'gl', 1, 500000, 500000],
      ['', '', '', '', '', 'Total Materiales', 500000],
      ['', '', 'B) MANO DE OBRA'],
      ['', '', 'CATEGORÍA', '', 'HORAS', 'C. HORARIO', 'TOTAL'],
      ['', '', 'Oficial', '', 4, 10000, 40000],
      ['', '', '', '', '', 'Total Mano de Obra', 40000],
    ]);
    const result = parseApuSheet(ws);
    expect(result.has('A.1')).toBe(true);
    const apu = result.get('A.1')!;
    expect(apu.materials).toHaveLength(1);
    expect(apu.materials[0].description).toBe('Cartel metálico');
    expect(apu.materials[0].quantity).toBe(1);
    expect(apu.materials[0].unitCost).toBe(500000);
    expect(apu.labor).toHaveLength(1);
    expect(apu.labor[0].category).toBe('Oficial');
    expect(apu.labor[0].quantity).toBe(4);
  });

  it('devuelve mapa vacío para hoja sin datos APU', () => {
    const ws = makeSheet([['', 'Sin datos']]);
    const result = parseApuSheet(ws);
    expect(result.size).toBe(0);
  });
});

// ============================================
// parseItemsSheet — estructura RED CLOACAL style (3 niveles)
// ============================================

describe('parseItemsSheet — 3 niveles', () => {
  const apuMap = new Map();
  const ws = makeSheet([
    ['', '', 'ITEM', 'DESCRIPCIÓN', 'Unidad', 'Cantidad', 'Precio Unitario', 'Importe'],
    ['', '', 'RUBRO A: TRABAJOS PRELIMINARES'],
    ['', 1, 'A.1', 'Cartel de obra', 'gl', 1, 3290527, 3290527],
    ['', '', 'RUBRO B: COLECTOR CLOACAL'],
    ['', '', 'B.1', 'Excavación de zanja'],
    ['', 2, 'B.1.1', 'A cielo abierto hasta 2,5m', 'm3', 100, 50000, 5000000],
    ['', 3, 'B.1.2', 'Entre 2,5 y 4m', 'm3', 200, 60000, 12000000],
    ['', '', 'SUBTOTAL RUBRO B', '', '', '', '', 17000000],
  ]);

  it('crea categorías correctamente', () => {
    const { categories } = parseItemsSheet(ws, apuMap);
    expect(categories).toHaveLength(2);
    expect(categories[0].name).toBe('RUBRO A: TRABAJOS PRELIMINARES');
    expect(categories[1].name).toBe('RUBRO B: COLECTOR CLOACAL');
  });

  it('crea etapa hoja (leaf stage) para ítems directos', () => {
    const { categories } = parseItemsSheet(ws, apuMap);
    const stageA1 = categories[0].stages[0];
    expect(stageA1.number).toBe('A.1');
    expect(stageA1.quantity).toBe(1);
    expect(stageA1.unitPrice).toBe(3290527);
    expect(stageA1.items).toHaveLength(0);
  });

  it('crea etapa grupo con sub-ítems para ítems de 2 niveles', () => {
    const { categories } = parseItemsSheet(ws, apuMap);
    const stageB1 = categories[1].stages[0];
    expect(stageB1.number).toBe('B.1');
    expect(stageB1.items).toHaveLength(2);
    expect(stageB1.items[0].number).toBe('B.1.1');
    expect(stageB1.items[1].number).toBe('B.1.2');
  });

  it('ignora filas de subtotal', () => {
    const { categories } = parseItemsSheet(ws, apuMap);
    const allStages = categories.flatMap((c) => c.stages);
    expect(allStages.every((s) => !s.description.toLowerCase().includes('subtotal'))).toBe(true);
  });
});

// ============================================
// parseItemsSheet — estructura VIVIENDAS style (2 niveles, coma como separador)
// ============================================

describe('parseItemsSheet — 2 niveles', () => {
  const apuMap = new Map();
  const ws = makeSheet([
    ['', 'N° Item', 'Designación', 'Unidad', 'Cantidad', 'Precio', '', '$'],
    ['', '', '', '', '', 'Unitario', 'Parcial', 'item'],
    ['', '10', 'TAREAS PRELIMINARES', '', '', '', '', 14266],
    ['', '10,1', 'Replanteo platea', 'm2', 44.6, 319.88, 14266, ''],
    ['', '20', 'FUNDACIONES', '', '', '', '', 1011035],
    ['', '20,1', 'Excavacion para zanjas', 'm3', 5.29, 7031.77, 37198, ''],
    ['', '20,2', 'Film de polietileno', 'm2', 57, 311.52, 17756, ''],
  ]);

  it('crea 2 categorías', () => {
    const { categories } = parseItemsSheet(ws, apuMap);
    expect(categories).toHaveLength(2);
    expect(categories[0].name).toBe('TAREAS PRELIMINARES');
  });

  it('crea ítems como leaf stages', () => {
    const { categories } = parseItemsSheet(ws, apuMap);
    expect(categories[0].stages).toHaveLength(1);
    expect(categories[0].stages[0].number).toBe('10,1');
    expect(categories[1].stages).toHaveLength(2);
  });
});

// ============================================
// parseBuffer — integración con archivo real
// ============================================

describe('parseBuffer — integración', () => {
  it('parsea un workbook mínimo de extremo a extremo', () => {
    const wb = makeWorkbook({
      'Presupuesto': [
        ['', 'Item', 'Descripción', 'Unidad', 'Cantidad', 'P. Unitario', 'Total'],
        ['', 'RUBRO A'],
        ['', 'A.1', 'Tarea de prueba', 'gl', 1, 100000, 100000],
      ],
      'k': [
        ['', 'DETERMINACIÓN DE K'],
        ['', 'Gastos Generales', 0.10, '(%)'],
        ['', 'Beneficio', 0.08, '(%)'],
        ['', 'IVA', 0.21, '(%)'],
      ],
    });
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const result = parseBuffer(buffer);

    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].stages).toHaveLength(1);
    expect(result.coeficienteK.gastosGeneralesPct).toBe(0.10);
    expect(result.coeficienteK.ivaPct).toBe(0.21);
    expect(result.advertencias).toHaveLength(0);
  });

  it('lanza error cuando no hay hoja de ítems', () => {
    const wb = makeWorkbook({ 'Datos': [['nombre', 'fecha']] });
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    expect(() => parseBuffer(buffer)).toThrow('No se encontró una planilla de ítems válida');
  });

  it('incluye advertencia cuando no hay hoja K', () => {
    const wb = makeWorkbook({
      'Items': [
        ['', 'ITEM', 'DESCRIPCIÓN', 'Unidad', 'Cantidad', 'P. Unitario', 'Total'],
        ['', 'CAP 1'],
        ['', 'A.1', 'Tarea', 'gl', 1, 50000, 50000],
      ],
    });
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const result = parseBuffer(buffer);
    expect(result.advertencias.some((a) => a.includes('Coeficiente K'))).toBe(true);
    expect(result.coeficienteK.gastosGeneralesPct).toBe(0);
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que pasan**

```bash
pnpm --filter @construccion/api test -- --reporter=verbose excel-parser
```

Expected: todos los tests en `PASS`. Si alguno falla, ajustar `excel-parser.ts` (no el test) hasta que pasen.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/budget-versions/__tests__/excel-parser.test.ts apps/api/src/modules/budget-versions/excel-parser.ts
git commit -m "test: agregar tests para excel-parser"
```

---

## Task 4: Agregar importFromParsed() al servicio

**Files:**
- Modify: `apps/api/src/modules/budget-versions/budget-versions.service.ts`

- [ ] **Step 1: Agregar import de `parseBuffer`, tipos y `generateSimpleCode` en la cabecera del servicio**

En `apps/api/src/modules/budget-versions/budget-versions.service.ts`, buscar la línea:
```typescript
import { generateCode } from '../../shared/utils/code-generator';
```
Reemplazar por:
```typescript
import { generateCode, generateSimpleCode } from '../../shared/utils/code-generator';
```

Y agregar al bloque de imports de `@construccion/shared`:
```typescript
import type { ParsedBudget, ParsedPriceAnalysis } from '@construccion/shared';
```

- [ ] **Step 2: Agregar el método privado `createPriceAnalysisFromParsed` a la clase `BudgetVersionsService`**

Agregar antes del método `findAll` en la clase (después del método `recalculateTotals`):

```typescript
private async createPriceAnalysisFromParsed(
  data: ParsedPriceAnalysis,
  budgetItemId: string,
  organizationId: string
): Promise<void> {
  const code = await generateSimpleCode('priceAnalysis', organizationId);
  const pa = await prisma.priceAnalysis.create({
    data: { code, budgetItemId, organizationId },
  });

  for (const mat of data.materials) {
    await prisma.analysisMaterial.create({
      data: {
        description: mat.description,
        unit: mat.unit,
        quantity: mat.quantity,
        unitCost: mat.unitCost,
        wastePct: 0,
        totalCost: new Prisma.Decimal(mat.quantity * mat.unitCost),
        priceAnalysisId: pa.id,
      },
    });
  }

  for (const lab of data.labor) {
    await prisma.analysisLabor.create({
      data: {
        category: lab.category,
        quantity: lab.quantity,
        hourlyRate: lab.hourlyRate,
        totalCost: new Prisma.Decimal(lab.quantity * lab.hourlyRate),
        priceAnalysisId: pa.id,
      },
    });
  }

  for (const tr of data.transport) {
    await prisma.analysisTransport.create({
      data: {
        description: tr.description,
        unit: tr.unit,
        quantity: tr.quantity,
        unitCost: tr.unitCost,
        totalCost: new Prisma.Decimal(tr.quantity * tr.unitCost),
        priceAnalysisId: pa.id,
      },
    });
  }
}
```

- [ ] **Step 3: Agregar el método público `importFromParsed` a la clase `BudgetVersionsService`**

Agregar justo después del método `create` (que termina con `return version;`):

```typescript
async importFromParsed(
  data: { projectId: string; name: string; description?: string; parsedBudget: ParsedBudget },
  organizationId: string
) {
  // Validar límite de ítems
  const totalItems = data.parsedBudget.categories
    .flatMap((c) => c.stages)
    .reduce((sum, s) => sum + Math.max(1, s.items.length), 0);
  if (totalItems > 500) {
    throw new ValidationError(`El archivo tiene ${totalItems} ítems. El límite es 500.`);
  }

  // Verificar que el proyecto existe
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, organizationId, deletedAt: null },
  });
  if (!project) throw new NotFoundError('Proyecto', data.projectId);

  // Calcular número de versión y código
  const lastVersion = await prisma.budgetVersion.findFirst({
    where: { projectId: data.projectId, deletedAt: null },
    orderBy: { version: 'desc' },
    select: { version: true },
  });
  const nextVersion = (lastVersion?.version ?? 0) + 1;
  const code = await generateCode('budgetVersion', organizationId);
  const codeWithVersion = `${code}-v${nextVersion}`;

  const { gastosGeneralesPct, beneficioPct, gastosFinancierosPct, ivaPct } =
    data.parsedBudget.coeficienteK;
  const k = this.calculateK(gastosGeneralesPct, beneficioPct, gastosFinancierosPct, ivaPct);

  // Crear BudgetVersion
  const version = await prisma.budgetVersion.create({
    data: {
      code: codeWithVersion,
      version: nextVersion,
      name: data.name,
      description: data.description,
      gastosGeneralesPct,
      beneficioPct,
      gastosFinancierosPct,
      ivaPct,
      coeficienteK: k,
      projectId: data.projectId,
      organizationId,
    },
  });

  try {
    for (let catIdx = 0; catIdx < data.parsedBudget.categories.length; catIdx++) {
      const cat = data.parsedBudget.categories[catIdx];
      const category = await prisma.budgetCategory.create({
        data: {
          number: cat.number,
          name: cat.name,
          order: catIdx + 1,
          budgetVersionId: version.id,
        },
      });

      for (const stage of cat.stages) {
        const hasSubItems = stage.items.length > 0;
        const createdStage = await prisma.budgetStage.create({
          data: {
            number: stage.number,
            description: stage.description,
            unit: stage.unit || 'gl',
            quantity: hasSubItems ? 1 : stage.quantity,
            unitPrice: hasSubItems ? 0 : stage.unitPrice,
            totalPrice: hasSubItems ? 0 : new Prisma.Decimal(stage.quantity * stage.unitPrice),
            categoryId: category.id,
          },
        });

        if (hasSubItems) {
          for (const item of stage.items) {
            const createdItem = await prisma.budgetItem.create({
              data: {
                number: item.number,
                description: item.description,
                unit: item.unit || 'gl',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: new Prisma.Decimal(item.quantity * item.unitPrice),
                stageId: createdStage.id,
              },
            });
            if (item.priceAnalysis) {
              await this.createPriceAnalysisFromParsed(item.priceAnalysis, createdItem.id, organizationId);
            }
          }
        } else {
          // Etapa hoja: crear un BudgetItem espejo
          const createdItem = await prisma.budgetItem.create({
            data: {
              number: stage.number,
              description: stage.description,
              unit: stage.unit || 'gl',
              quantity: stage.quantity,
              unitPrice: stage.unitPrice,
              totalPrice: new Prisma.Decimal(stage.quantity * stage.unitPrice),
              stageId: createdStage.id,
            },
          });
          if (stage.priceAnalysis) {
            await this.createPriceAnalysisFromParsed(stage.priceAnalysis, createdItem.id, organizationId);
          }
        }
      }
    }

    await this.recalculateTotals(version.id);
    return await this.findById(version.id, organizationId);
  } catch (error) {
    // Rollback: eliminar la versión (cascade elimina categorías, etapas, ítems, APUs)
    await prisma.budgetVersion.delete({ where: { id: version.id } });
    throw error;
  }
}
```

- [ ] **Step 4: Verificar typecheck**

```bash
pnpm --filter @construccion/api typecheck
```

Expected: 0 errores.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/budget-versions/budget-versions.service.ts
git commit -m "feat: agregar importFromParsed al servicio de versiones de presupuesto"
```

---

## Task 5: Tests para importFromParsed()

**Files:**
- Modify: `apps/api/src/modules/budget-versions/__tests__/budget-versions.service.test.ts`

- [ ] **Step 1: Escribir test de importFromParsed — al final del archivo de tests existente**

Agregar al final del archivo `budget-versions.service.test.ts` (después de todos los `describe` existentes):

```typescript
// ---------------------------------------------------------------------------
// importFromParsed
// ---------------------------------------------------------------------------

describe('BudgetVersionsService.importFromParsed', () => {
  const orgId = 'org-1';
  const projectId = 'proj-1';

  const minimalParsed = {
    coeficienteK: { gastosGeneralesPct: 0.10, beneficioPct: 0.08, gastosFinancierosPct: 0, ivaPct: 0.21 },
    categories: [
      {
        number: 1,
        name: 'TRABAJOS PRELIMINARES',
        stages: [
          {
            number: 'A.1',
            description: 'Cartel de obra',
            unit: 'gl',
            quantity: 1,
            unitPrice: 100000,
            items: [],
            priceAnalysis: undefined,
          },
        ],
      },
    ],
    advertencias: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock project exists
    mockPrisma.project.findFirst.mockResolvedValue({ id: projectId });
    // Mock no previous versions
    mockPrisma.budgetVersion.findFirst.mockResolvedValue(null);
    // generateCode mock ya está definido globalmente
    // Mock version create
    mockPrisma.budgetVersion.create.mockResolvedValue({ id: 'ver-1', code: 'PRES-2025-00001-v1' });
    // Mock category create
    mockPrisma.budgetCategory.create.mockResolvedValue({ id: 'cat-1' });
    // Mock stage create
    mockPrisma.budgetStage.create.mockResolvedValue({ id: 'stage-1' });
    // Mock item create
    mockPrisma.budgetItem.create.mockResolvedValue({ id: 'item-1' });
    // Mock recalculate internals
    mockPrisma.budgetCategory.findMany.mockResolvedValue([
      { id: 'cat-1', stages: [{ id: 'stage-1', items: [{ id: 'item-1', quantity: 1, unitPrice: 100000 }], quantity: 1, unitPrice: 100000 }] },
    ]);
    mockPrisma.budgetItem.update.mockResolvedValue({});
    mockPrisma.budgetStage.update.mockResolvedValue({});
    mockPrisma.budgetCategory.update.mockResolvedValue({});
    mockPrisma.budgetVersion.update.mockResolvedValue({});
    mockPrisma.budgetStage.findUnique.mockResolvedValue({ totalPrice: 100000 });
    // Mock findById (used at the end)
    mockPrisma.budgetVersion.findFirst.mockResolvedValueOnce({ id: projectId }) // project check
      .mockResolvedValueOnce(null) // lastVersion check
      .mockResolvedValue({ // findById
        id: 'ver-1',
        categories: [],
        project: { id: projectId, code: 'OBR-001', name: 'Test' },
      });
  });

  it('lanza ValidationError si hay más de 500 ítems', async () => {
    const service = new BudgetVersionsService();
    const manyItems = Array.from({ length: 502 }, (_, i) => ({
      number: `A.${i + 1}`,
      description: `Ítem ${i + 1}`,
      unit: 'gl',
      quantity: 1,
      unitPrice: 1000,
      items: [],
    }));
    const bigParsed = {
      ...minimalParsed,
      categories: [{ number: 1, name: 'CAP', stages: manyItems }],
    };

    await expect(
      service.importFromParsed({ projectId, name: 'Test', parsedBudget: bigParsed }, orgId)
    ).rejects.toThrow(ValidationError);
  });

  it('lanza NotFoundError si el proyecto no existe', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null);
    const service = new BudgetVersionsService();
    await expect(
      service.importFromParsed({ projectId, name: 'Test', parsedBudget: minimalParsed }, orgId)
    ).rejects.toThrow(NotFoundError);
  });

  it('crea BudgetVersion con los datos de K correctos', async () => {
    const service = new BudgetVersionsService();
    await service.importFromParsed({ projectId, name: 'Importado', parsedBudget: minimalParsed }, orgId);

    expect(mockPrisma.budgetVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Importado',
          gastosGeneralesPct: 0.10,
          beneficioPct: 0.08,
          ivaPct: 0.21,
          projectId,
          organizationId: orgId,
        }),
      })
    );
  });

  it('crea categorías, etapas e ítems', async () => {
    const service = new BudgetVersionsService();
    await service.importFromParsed({ projectId, name: 'Test', parsedBudget: minimalParsed }, orgId);

    expect(mockPrisma.budgetCategory.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.budgetStage.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.budgetItem.create).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Correr tests y verificar que pasan**

```bash
pnpm --filter @construccion/api test -- --reporter=verbose budget-versions
```

Expected: todos los tests de `importFromParsed` en PASS. Si hay mocks que ajustar (las cadenas de `findFirst` son delicadas), ajustar el mock setup.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/budget-versions/__tests__/budget-versions.service.test.ts
git commit -m "test: agregar tests para importFromParsed"
```

---

## Task 6: Agregar controller y rutas de importación

**Files:**
- Modify: `apps/api/src/modules/budget-versions/budget-versions.controller.ts`
- Modify: `apps/api/src/modules/budget-versions/budget-versions.routes.ts`

- [ ] **Step 1: Agregar métodos al controller**

En `budget-versions.controller.ts`, agregar al inicio del archivo las importaciones necesarias:
```typescript
import { parseBuffer } from './excel-parser';
import { ValidationError } from '../../shared/utils/errors';
```

Luego agregar estos dos métodos al final de la clase `BudgetVersionsController` (antes del cierre `}`):

```typescript
  // ============================================
  // Importación desde Excel
  // ============================================

  async parseImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new ValidationError('Se requiere un archivo Excel (.xlsx o .xls)');
      }
      const result = parseBuffer(req.file.buffer);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async confirmImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await budgetVersionsService.importFromParsed(
        {
          projectId: req.params.projectId,
          name: req.body.name,
          description: req.body.description,
          parsedBudget: req.body.parsedBudget,
        },
        req.user!.organizationId
      );
      sendCreated(res, version);
    } catch (error) {
      next(error);
    }
  }
```

- [ ] **Step 2: Agregar rutas e importaciones en budget-versions.routes.ts**

Modificar `budget-versions.routes.ts`. Agregar al bloque de imports al inicio:

```typescript
import multer from 'multer';
import path from 'path';
import { confirmImportSchema } from '@construccion/shared';
```

Agregar la configuración de multer justo después de `const router: Router = Router({ mergeParams: true });` y antes de `router.use(authMiddleware)`:

```typescript
const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Formato no soportado. Solo se aceptan archivos .xlsx y .xls'));
    }
  },
});
```

Agregar las dos rutas de importación después de `router.use(authMiddleware)` y ANTES de las rutas `/:id` existentes:

```typescript
// POST /projects/:projectId/budget-versions/import/parse — Parsear Excel (preview)
router.post(
  '/import/parse',
  requirePermission('budget_versions', 'write'),
  uploadExcel.single('file'),
  budgetVersionsController.parseImport.bind(budgetVersionsController)
);

// POST /projects/:projectId/budget-versions/import/confirm — Confirmar importación
router.post(
  '/import/confirm',
  requirePermission('budget_versions', 'write'),
  validateBody(confirmImportSchema),
  budgetVersionsController.confirmImport.bind(budgetVersionsController)
);
```

- [ ] **Step 3: Verificar typecheck**

```bash
pnpm --filter @construccion/api typecheck
```

Expected: 0 errores.

- [ ] **Step 4: Smoke test manual (opcional pero recomendado)**

Levantar el API y probar con curl:
```bash
pnpm dev:api
# En otra terminal:
curl -X POST http://localhost:3001/api/v1/projects/TEST/budget-versions/import/parse \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/RED_CLOACAL_v3.xlsx"
```

Expected: JSON con `coeficienteK`, `categories`, `advertencias`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/budget-versions/budget-versions.controller.ts \
        apps/api/src/modules/budget-versions/budget-versions.routes.ts
git commit -m "feat: agregar endpoints de importación Excel al módulo budget-versions"
```

---

## Task 7: Construir ImportBudgetVersionDialog

**Files:**
- Create: `apps/web/src/components/forms/import-budget-version-dialog.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
'use client';

import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Upload, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { ParsedBudget, ParsedCoeficienteK } from '@construccion/shared';

type Step = 'upload' | 'parsing' | 'preview' | 'confirming';

interface ImportBudgetVersionDialogProps {
  projectId: string;
  onSuccess: (versionId: string) => void;
  onCancel: () => void;
}

export function ImportBudgetVersionDialog({
  projectId,
  onSuccess,
  onCancel,
}: ImportBudgetVersionDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [versionName, setVersionName] = useState('');
  const [parsedBudget, setParsedBudget] = useState<ParsedBudget | null>(null);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warningsCollapsed, setWarningsCollapsed] = useState(true);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const parseMutation = useMutation({
    mutationFn: (f: File) => {
      const form = new FormData();
      form.append('file', f);
      return api.post<ParsedBudget>(
        `/projects/${projectId}/budget-versions/import/parse`,
        form
      );
    },
    onSuccess: (data) => {
      setParsedBudget(data);
      setAdvertencias(data.advertencias);
      setStep('preview');
    },
    onError: (err: any) => {
      setError(err.message || 'Error al analizar el archivo');
      setStep('upload');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.post<{ id: string }>(`/projects/${projectId}/budget-versions/import/confirm`, {
        name: versionName,
        parsedBudget,
      }),
    onSuccess: (data) => {
      onSuccess(data.id);
    },
    onError: (err: any) => {
      setError(err.message || 'Error al crear la versión');
      setStep('preview');
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setVersionName(f.name.replace(/\.(xlsx?|xls)$/i, ''));
      setError(null);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setError(null);
    setStep('parsing');
    parseMutation.mutate(file);
  };

  // ── Update helpers ──────────────────────────────────────────────────────────

  const updateK = (field: keyof ParsedCoeficienteK, value: number) => {
    setParsedBudget((prev) =>
      prev ? { ...prev, coeficienteK: { ...prev.coeficienteK, [field]: value } } : null
    );
  };

  const updateStage = (catIdx: number, stageIdx: number, field: string, value: any) => {
    setParsedBudget((prev) => {
      if (!prev) return null;
      const cats = prev.categories.map((c, ci) => {
        if (ci !== catIdx) return c;
        return {
          ...c,
          stages: c.stages.map((s, si) =>
            si === stageIdx ? { ...s, [field]: value } : s
          ),
        };
      });
      return { ...prev, categories: cats };
    });
  };

  const updateItem = (catIdx: number, stageIdx: number, itemIdx: number, field: string, value: any) => {
    setParsedBudget((prev) => {
      if (!prev) return null;
      const cats = prev.categories.map((c, ci) => {
        if (ci !== catIdx) return c;
        return {
          ...c,
          stages: c.stages.map((s, si) => {
            if (si !== stageIdx) return s;
            return {
              ...s,
              items: s.items.map((it, ii) =>
                ii === itemIdx ? { ...it, [field]: value } : it
              ),
            };
          }),
        };
      });
      return { ...prev, categories: cats };
    });
  };

  const kValue = parsedBudget
    ? (1 + parsedBudget.coeficienteK.gastosGeneralesPct) *
      (1 + parsedBudget.coeficienteK.beneficioPct) *
      (1 + parsedBudget.coeficienteK.gastosFinancierosPct) *
      (1 + parsedBudget.coeficienteK.ivaPct)
    : 1;

  // ── Render steps ───────────────────────────────────────────────────────────

  if (step === 'upload') {
    return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            {file ? file.name : 'Hacer clic para seleccionar archivo'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Excel .xlsx o .xls — máximo 10 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {file && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre de la versión</label>
            <Input
              value={versionName}
              onChange={(e) => setVersionName(e.target.value)}
              placeholder="Presupuesto Base v1"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleAnalyze} disabled={!file || !versionName.trim()}>
            <Upload className="mr-2 h-4 w-4" />
            Analizar archivo
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'parsing') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Analizando archivo...</p>
      </div>
    );
  }

  if (step === 'preview' && parsedBudget) {
    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {/* Advertencias */}
        {advertencias.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
            <button
              className="flex items-center gap-2 w-full text-yellow-800 font-medium"
              onClick={() => setWarningsCollapsed((v) => !v)}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {advertencias.length} advertencia{advertencias.length > 1 ? 's' : ''} detectada
              {advertencias.length > 1 ? 's' : ''}
              <span className="ml-auto text-xs">{warningsCollapsed ? '▼' : '▲'}</span>
            </button>
            {!warningsCollapsed && (
              <ul className="mt-2 space-y-1 text-yellow-700">
                {advertencias.map((a, i) => (
                  <li key={i} className="text-xs">• {a}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Coeficiente K */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Coeficiente K</h4>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                ['gastosGeneralesPct', 'GG %'],
                ['beneficioPct', 'Beneficio %'],
                ['gastosFinancierosPct', 'GF %'],
                ['ivaPct', 'IVA %'],
              ] as [keyof ParsedCoeficienteK, string][]
            ).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={parsedBudget.coeficienteK[field]}
                  onChange={(e) => updateK(field, parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            K calculado: <strong>{kValue.toFixed(4)}</strong>
          </p>
        </div>

        {/* Ítems */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Ítems del presupuesto</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2 w-20">Código</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-left p-2 w-14">Unidad</th>
                  <th className="text-right p-2 w-20">Cantidad</th>
                  <th className="text-right p-2 w-28">P. Unitario</th>
                  <th className="text-right p-2 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {parsedBudget.categories.map((cat, catIdx) => (
                  <>
                    {/* Fila categoría */}
                    <tr key={`cat-${catIdx}`} className="bg-slate-100 font-medium">
                      <td className="p-2 text-slate-600">{cat.number}</td>
                      <td className="p-2 uppercase text-slate-700" colSpan={5}>
                        {cat.name}
                      </td>
                    </tr>

                    {cat.stages.map((stage, stageIdx) => (
                      <>
                        {stage.items.length > 0 ? (
                          /* Fila de etapa grupo (sin precio) */
                          <>
                            <tr key={`stage-${catIdx}-${stageIdx}`} className="bg-slate-50">
                              <td className="p-2 font-medium text-slate-600">{stage.number}</td>
                              <td className="p-2 font-medium text-slate-600" colSpan={5}>
                                {stage.description}
                              </td>
                            </tr>
                            {stage.items.map((item, itemIdx) => (
                              <tr
                                key={`item-${catIdx}-${stageIdx}-${itemIdx}`}
                                className="border-t hover:bg-muted/30"
                              >
                                <td className="p-1 pl-6 text-slate-500">{item.number}</td>
                                <td className="p-1">
                                  <input
                                    className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1"
                                    value={item.description}
                                    onChange={(e) => updateItem(catIdx, stageIdx, itemIdx, 'description', e.target.value)}
                                  />
                                </td>
                                <td className="p-1">
                                  <input
                                    className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-center"
                                    value={item.unit}
                                    onChange={(e) => updateItem(catIdx, stageIdx, itemIdx, 'unit', e.target.value)}
                                  />
                                </td>
                                <td className="p-1 text-right">
                                  <input
                                    type="number"
                                    className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-right"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(catIdx, stageIdx, itemIdx, 'quantity', parseFloat(e.target.value) || 0)}
                                  />
                                </td>
                                <td className="p-1 text-right">
                                  <input
                                    type="number"
                                    className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-right"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(catIdx, stageIdx, itemIdx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  />
                                </td>
                                <td className="p-2 text-right font-mono">
                                  {formatCurrency(item.quantity * item.unitPrice)}
                                </td>
                              </tr>
                            ))}
                          </>
                        ) : (
                          /* Fila etapa hoja (leaf) */
                          <tr key={`stage-${catIdx}-${stageIdx}`} className="border-t hover:bg-muted/30">
                            <td className="p-1">{stage.number}</td>
                            <td className="p-1">
                              <input
                                className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1"
                                value={stage.description}
                                onChange={(e) => updateStage(catIdx, stageIdx, 'description', e.target.value)}
                              />
                            </td>
                            <td className="p-1">
                              <input
                                className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-center"
                                value={stage.unit}
                                onChange={(e) => updateStage(catIdx, stageIdx, 'unit', e.target.value)}
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-right"
                                value={stage.quantity}
                                onChange={(e) => updateStage(catIdx, stageIdx, 'quantity', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-1 text-right">
                              <input
                                type="number"
                                className="w-full bg-transparent outline-none focus:bg-white focus:border focus:border-primary rounded px-1 text-right"
                                value={stage.unitPrice}
                                onChange={(e) => updateStage(catIdx, stageIdx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="p-2 text-right font-mono">
                              {formatCurrency(stage.quantity * stage.unitPrice)}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* APUs detectados */}
        {(() => {
          const withApu = parsedBudget.categories
            .flatMap((c) => [
              ...c.stages.filter((s) => s.priceAnalysis),
              ...c.stages.flatMap((s) => s.items.filter((i) => i.priceAnalysis)),
            ]);
          if (withApu.length === 0) return null;
          return (
            <div>
              <h4 className="text-sm font-semibold mb-1">APUs detectados</h4>
              <p className="text-xs text-muted-foreground">
                Se importarán {withApu.length} Análisis de Precios Unitarios. Se pueden editar desde la vista de detalle después de importar.
              </p>
            </div>
          );
        })()}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2 border-t sticky bottom-0 bg-background">
          <Button variant="outline" onClick={() => setStep('upload')}>
            Volver
          </Button>
          <Button
            onClick={() => {
              setStep('confirming');
              confirmMutation.mutate();
            }}
            disabled={confirmMutation.isPending}
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando versión...
              </>
            ) : (
              'Crear version de presupuesto'
            )}
          </Button>
        </div>
      </div>
    );
  }

  // step === 'confirming' — spinner de espera mientras la mutación termina
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Creando versión de presupuesto...</p>
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck del frontend**

```bash
pnpm --filter @construccion/web typecheck
```

Expected: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/forms/import-budget-version-dialog.tsx
git commit -m "feat: construir ImportBudgetVersionDialog con flujo de 4 pasos"
```

---

## Task 8: Integrar dialog en la página de budget-versions

**Files:**
- Modify: `apps/web/src/app/(dashboard)/projects/[id]/budget-versions/page.tsx`

- [ ] **Step 1: Agregar imports en la página**

Agregar al bloque de imports de la página:

```typescript
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportBudgetVersionDialog } from '@/components/forms/import-budget-version-dialog';
```

- [ ] **Step 2: Agregar `useRouter` al comienzo del componente**

Justo después de `const queryClient = useQueryClient();`, agregar:

```typescript
const router = useRouter();
```

- [ ] **Step 3: Reemplazar el Create Dialog**

Buscar y reemplazar el bloque completo del "Create Dialog" (de `{/* Create Dialog */}` hasta el cierre `</Dialog>`):

```tsx
      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Version de Presupuesto</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="manual">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="manual" className="flex-1">
                Crear manualmente
              </TabsTrigger>
              <TabsTrigger value="import" className="flex-1">
                Importar desde Excel
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <BudgetVersionForm
                projectId={projectId}
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['budget-versions', projectId] });
                  toast.success('Version creada correctamente');
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </TabsContent>
            <TabsContent value="import">
              <ImportBudgetVersionDialog
                projectId={projectId}
                onSuccess={(versionId) => {
                  setCreateDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['budget-versions', projectId] });
                  toast.success('Presupuesto importado correctamente');
                  router.push(`/projects/${projectId}/budget-versions/${versionId}`);
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 4: Verificar typecheck**

```bash
pnpm --filter @construccion/web typecheck
```

Expected: 0 errores.

- [ ] **Step 5: Prueba manual end-to-end**

1. `pnpm dev` para levantar API y web
2. Ir a `/projects/{id}/budget-versions`
3. Clic en "Nueva Version"
4. Seleccionar tab "Importar desde Excel"
5. Subir `/Users/pablobersier/Downloads/RED_CLOACAL_v3.xlsx`
6. Clic en "Analizar archivo"
7. Verificar que aparecen los ítems RUBRO A, B, C con sus precios
8. Verificar que el coeficiente K tiene valores > 0
9. Editar un ítem para probar inline editing
10. Clic en "Crear version de presupuesto"
11. Verificar que redirige a la página de la versión creada con todos los ítems

- [ ] **Step 6: Commit final**

```bash
git add apps/web/src/app/(dashboard)/projects/[id]/budget-versions/page.tsx
git commit -m "feat: integrar importación desde Excel en página de versiones de presupuesto"
```

---

## Self-Review del Plan

**Cobertura del spec:**
- ✅ Importación completa: ítems + K + APUs
- ✅ Vista previa editable antes de confirmar
- ✅ Dos endpoints: `/import/parse` y `/import/confirm`
- ✅ Parser aislado y testeable
- ✅ Integrado en dialog con tabs al crear nueva versión
- ✅ Rollback en caso de fallo en creación
- ✅ Límite de 500 ítems
- ✅ Soporte .xlsx y .xls vía `xlsx` (SheetJS)
- ✅ Advertencias mostradas en banner colapsable

**Tipos consistentes:**
- `ParsedBudget`, `ParsedBudgetStage`, `ParsedBudgetItem`, `ParsedPriceAnalysis` se definen en Task 1 y se usan en Tasks 2, 4, 7.
- `confirmImportSchema` se define en Task 1 y se importa en Task 6.
- `parseBuffer` se exporta en Task 2 y se usa en Task 6.
- `importFromParsed` se agrega en Task 4 y se llama en Task 6.

**Sin placeholders:** Todo el código está completo.
