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
