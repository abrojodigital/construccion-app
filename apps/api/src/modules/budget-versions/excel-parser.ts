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
