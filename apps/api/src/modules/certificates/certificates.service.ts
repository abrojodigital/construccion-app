import { prisma, Prisma } from '@construccion/database';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/utils/errors';
import { generateCode } from '../../shared/utils/code-generator';

// ============================================
// Interfaces
// ============================================

interface CreateCertificateInput {
  periodStart: Date;
  periodEnd: Date;
  acopioPct?: number;
  anticipoPct?: number;
  fondoReparoPct?: number;
  ivaPct?: number;
  adjustmentFactor?: number;
}

interface CertificateFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID';
}

interface UpdateCertificateItemInput {
  currentAdvance: number;
}

interface UpdateCertificateInput {
  adjustmentFactor: number;
}

// ============================================
// Service
// ============================================

export class CertificatesService {
  /**
   * Crear una nueva certificacion para un proyecto.
   * Carga automaticamente los items desde la version de presupuesto aprobada.
   */
  async create(
    projectId: string,
    data: CreateCertificateInput,
    organizationId: string
  ) {
    // Buscar la version de presupuesto aprobada mas reciente para este proyecto
    const budgetVersion = await prisma.budgetVersion.findFirst({
      where: {
        projectId,
        organizationId,
        status: 'APPROVED',
        deletedAt: null,
      },
      orderBy: { approvedAt: 'desc' },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            stages: {
              orderBy: { number: 'asc' },
              include: {
                items: { orderBy: { number: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!budgetVersion) {
      throw new ValidationError('No hay version de presupuesto aprobada para este proyecto');
    }

    // Calcular el proximo numero de certificado
    const existingCount = await prisma.certificate.count({
      where: { projectId, organizationId, deletedAt: null },
    });
    const nextNumber = existingCount + 1;

    // Generar codigo unico
    const code = await generateCode('certificate', organizationId);

    // Obtener el certificado anterior (si existe) para arrastrar acumulados
    const previousCertificate = await prisma.certificate.findFirst({
      where: {
        projectId,
        organizationId,
        deletedAt: null,
        status: { not: 'DRAFT' },
      },
      orderBy: { number: 'desc' },
      include: { items: true },
    });

    // Indexar items del certificado anterior por budgetItemId
    const previousItemsMap = new Map<
      string,
      { totalAdvance: Prisma.Decimal; totalAmount: Prisma.Decimal }
    >();
    if (previousCertificate) {
      for (const item of previousCertificate.items) {
        previousItemsMap.set(item.budgetItemId, {
          totalAdvance: item.totalAdvance,
          totalAmount: item.totalAmount,
        });
      }
    }

    // Recolectar todos los items del presupuesto (3 niveles: categorías → etapas → ítems)
    const allBudgetItems = budgetVersion.categories.flatMap((cat) =>
      cat.stages.flatMap((stage) => stage.items)
    );

    // Preparar items de la certificacion
    const certificateItemsData = allBudgetItems.map((budgetItem) => {
      const prev = previousItemsMap.get(budgetItem.id);
      const previousAdvance = prev ? prev.totalAdvance : new Prisma.Decimal(0);
      const previousAmount = prev ? prev.totalAmount : new Prisma.Decimal(0);

      return {
        itemNumber: budgetItem.number,
        description: budgetItem.description,
        unit: budgetItem.unit,
        quantity: budgetItem.quantity,
        unitPrice: budgetItem.unitPrice,
        previousAdvance,
        previousAmount,
        currentAdvance: new Prisma.Decimal(0),
        currentAmount: new Prisma.Decimal(0),
        totalAdvance: previousAdvance,
        totalAmount: previousAmount,
        budgetItemId: budgetItem.id,
      };
    });

    // Crear certificado con todos sus items en una transaccion
    const certificate = await prisma.certificate.create({
      data: {
        code,
        number: nextNumber,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        acopioPct: data.acopioPct || 0,
        anticipoPct: data.anticipoPct || 0,
        fondoReparoPct: data.fondoReparoPct || 0,
        ivaPct: data.ivaPct || 0,
        adjustmentFactor: data.adjustmentFactor || 1,
        budgetVersionId: budgetVersion.id,
        projectId,
        organizationId,
        items: {
          create: certificateItemsData,
        },
      },
      include: {
        items: { orderBy: { itemNumber: 'asc' } },
        budgetVersion: { select: { id: true, code: true, name: true, version: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    return certificate;
  }

  /**
   * Listar certificados de un proyecto con paginacion y filtro por estado.
   */
  async findAll(projectId: string, organizationId: string, filters: CertificateFilters) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'number',
      sortOrder = 'desc',
      status,
    } = filters;

    const where: Prisma.CertificateWhereInput = {
      projectId,
      organizationId,
      deletedAt: null,
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          budgetVersion: { select: { id: true, code: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    return { data, pagination: { page, limit, total } };
  }

  /**
   * Obtener detalle de un certificado con todos sus items.
   */
  async findById(id: string, organizationId: string) {
    const certificate = await prisma.certificate.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        items: { orderBy: { itemNumber: 'asc' } },
        budgetVersion: { select: { id: true, code: true, name: true, version: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    if (!certificate) throw new NotFoundError('Certificado', id);
    return certificate;
  }

  /**
   * Actualizar campos editables de un certificado (solo DRAFT).
   * Actualmente permite cambiar el factor de ajuste (redeterminación).
   */
  async update(id: string, data: UpdateCertificateInput, organizationId: string) {
    const certificate = await this.findById(id, organizationId);

    if (certificate.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden editar certificados en estado Borrador');
    }

    await prisma.certificate.update({
      where: { id },
      data: { adjustmentFactor: new Prisma.Decimal(data.adjustmentFactor) },
    });

    // Recalcular totales con el nuevo factor
    await this.recalculateTotals(id, organizationId);

    return this.findById(id, organizationId);
  }

  /**
   * Actualizar el avance de un item de certificacion.
   * Solo permitido en certificados con estado DRAFT.
   * Recalcula montos del item y totales del certificado.
   */
  async updateItem(
    certificateId: string,
    itemId: string,
    data: UpdateCertificateItemInput,
    organizationId: string
  ) {
    // Verificar que el certificado existe y pertenece a la organizacion
    const certificate = await prisma.certificate.findFirst({
      where: { id: certificateId, organizationId, deletedAt: null },
    });

    if (!certificate) throw new NotFoundError('Certificado', certificateId);

    if (certificate.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden editar certificados en estado Borrador');
    }

    // Buscar el item
    const item = await prisma.certificateItem.findFirst({
      where: { id: itemId, certificateId },
    });

    if (!item) throw new NotFoundError('Item de certificado', itemId);

    // currentAdvance es el avance de ESTE periodo (ej: 0.15 = 15%)
    const currentAdvance = new Prisma.Decimal(data.currentAdvance);
    const previousAdvance = item.previousAdvance;

    // totalAdvance = previousAdvance + currentAdvance
    const totalAdvance = previousAdvance.add(currentAdvance);

    // Validar que el avance total no exceda 1.0 (100%)
    if (totalAdvance.greaterThan(new Prisma.Decimal(1))) {
      throw new ValidationError(
        `El avance total (${totalAdvance.toFixed(4)}) no puede exceder 1.0 (100%). ` +
          `Avance anterior: ${previousAdvance.toFixed(4)}, avance actual: ${currentAdvance.toFixed(4)}`
      );
    }

    // Calcular montos
    const quantity = item.quantity;
    const unitPrice = item.unitPrice;
    const currentAmount = currentAdvance.mul(quantity).mul(unitPrice);
    const totalAmount = totalAdvance.mul(quantity).mul(unitPrice);

    // Actualizar item y recalcular totales del certificado de forma atómica
    const [updatedItem] = await prisma.$transaction(async (tx) => {
      const updated = await tx.certificateItem.update({
        where: { id: itemId },
        data: {
          currentAdvance,
          currentAmount,
          totalAdvance,
          totalAmount,
        },
      });

      await this.recalculateTotalsInTx(tx, certificateId, organizationId);

      return [updated];
    });

    return updatedItem;
  }

  /**
   * Recalcular los totales de un certificado a partir de sus items (dentro de una transacción).
   * Requiere organizationId para garantizar que el certificado pertenece a la organización.
   */
  private async recalculateTotalsInTx(
    tx: Prisma.TransactionClient,
    certificateId: string,
    organizationId: string
  ): Promise<void> {
    const certificate = await tx.certificate.findFirst({
      where: { id: certificateId, organizationId },
      include: { items: true },
    });

    if (!certificate) return;

    // Subtotal = suma de currentAmount de todos los items
    let subtotal = new Prisma.Decimal(0);
    for (const item of certificate.items) {
      subtotal = subtotal.add(item.currentAmount);
    }

    // Deducciones
    const acopioAmount = subtotal.mul(certificate.acopioPct);
    const anticipoAmount = subtotal.mul(certificate.anticipoPct);
    const fondoReparoAmount = subtotal.mul(certificate.fondoReparoPct);

    // Neto antes de IVA
    const netBeforeIva = subtotal
      .sub(acopioAmount)
      .sub(anticipoAmount)
      .sub(fondoReparoAmount);

    // Aplicar factor de ajuste (redeterminacion de precios)
    const adjusted = netBeforeIva.mul(certificate.adjustmentFactor);

    // IVA
    const ivaAmount = adjusted.mul(certificate.ivaPct);

    // Total final
    const totalAmount = adjusted.add(ivaAmount);

    await tx.certificate.update({
      where: { id: certificateId },
      data: {
        subtotal,
        acopioAmount,
        anticipoAmount,
        fondoReparoAmount,
        ivaAmount,
        totalAmount,
      },
    });
  }

  /**
   * Recalcular los totales de un certificado (versión pública, fuera de transacción).
   * Usar solo cuando no se está dentro de una transacción Prisma.
   */
  async recalculateTotals(certificateId: string, organizationId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await this.recalculateTotalsInTx(tx, certificateId, organizationId);
    });
  }

  /**
   * Presentar certificado para aprobacion (DRAFT -> SUBMITTED).
   */
  async submit(id: string, organizationId: string) {
    const certificate = await this.findById(id, organizationId);

    if (certificate.status !== 'DRAFT') {
      throw new ConflictError('Solo se pueden presentar certificados en estado Borrador');
    }

    const updated = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        items: { orderBy: { itemNumber: 'asc' } },
        budgetVersion: { select: { id: true, code: true, name: true, version: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * Aprobar certificado (SUBMITTED -> APPROVED).
   * Los certificados aprobados son inmutables.
   */
  async approve(id: string, userId: string, organizationId: string) {
    const certificate = await this.findById(id, organizationId);

    if (certificate.status !== 'SUBMITTED') {
      throw new ConflictError('Solo se pueden aprobar certificados en estado Presentado');
    }

    const updated = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
      },
      include: {
        items: { orderBy: { itemNumber: 'asc' } },
        budgetVersion: { select: { id: true, code: true, name: true, version: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * Marcar certificado como Pagado (APPROVED -> PAID).
   */
  async markAsPaid(id: string, organizationId: string) {
    const certificate = await this.findById(id, organizationId);

    if (certificate.status !== 'APPROVED') {
      throw new ConflictError('Solo se pueden marcar como pagados los certificados aprobados');
    }

    return prisma.certificate.update({
      where: { id },
      data: { status: 'PAID' },
      include: {
        items: { orderBy: { itemNumber: 'asc' } },
        budgetVersion: { select: { id: true, code: true, name: true, version: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /**
   * Generar HTML de certificado para imprimir como PDF.
   */
  async exportHtml(id: string, organizationId: string): Promise<string> {
    const cert = await this.findById(id, organizationId);

    const STATUS: Record<string, string> = {
      DRAFT: 'Borrador', SUBMITTED: 'Presentado', APPROVED: 'Aprobado', PAID: 'Pagado',
    };
    const fmt = (n: number) =>
      n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pct = (n: number) => (Number(n) * 100).toFixed(2) + '%';
    const dateStr = (d: Date | string) => new Date(d).toLocaleDateString('es-AR');

    // Agrupar ítems por etapa (primeros dos segmentos del número)
    const grouped = new Map<string, typeof cert.items>();
    for (const item of cert.items) {
      const key = item.itemNumber.split('.').slice(0, 2).join('.');
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    }

    let itemRows = '';
    for (const [stageKey, items] of grouped) {
      const stageTotal = items.reduce((s, i) => s + Number(i.currentAmount), 0);
      itemRows += `
        <tr class="stage-row">
          <td colspan="9"><strong>Etapa ${stageKey}</strong></td>
          <td class="num"><strong>$${fmt(stageTotal)}</strong></td>
        </tr>`;
      for (const item of items) {
        const acopioItem = Number(item.currentAmount) * Number(cert.acopioPct);
        itemRows += `
        <tr>
          <td>${item.itemNumber}</td>
          <td>${item.description}</td>
          <td>${item.unit}</td>
          <td class="num">${Number(item.quantity).toLocaleString('es-AR', { maximumFractionDigits: 4 })}</td>
          <td class="num">$${fmt(Number(item.unitPrice))}</td>
          <td class="num">${pct(Number(item.previousAdvance))}</td>
          <td class="num"><strong>${pct(Number(item.currentAdvance))}</strong></td>
          <td class="num">${pct(Number(item.totalAdvance))}</td>
          <td class="num">$${fmt(acopioItem)}</td>
          <td class="num">$${fmt(Number(item.currentAmount))}</td>
        </tr>`;
      }
    }

    const netBeforeAdj = Number(cert.subtotal)
      - Number(cert.acopioAmount)
      - Number(cert.anticipoAmount)
      - Number(cert.fondoReparoAmount);
    const netAdj = netBeforeAdj * Number(cert.adjustmentFactor);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Certificado ${cert.code}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;padding:16mm}
    h1{font-size:18px;color:#1d4ed8;margin-bottom:4px}
    h2{font-size:12px;color:#374151;margin:16px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;text-transform:uppercase;letter-spacing:.05em}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;border-bottom:2px solid #1d4ed8;padding-bottom:12px}
    .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:10px;font-weight:700;background:#dbeafe;color:#1d4ed8}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
    .card{border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px}
    .card-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em}
    .card-value{font-size:15px;font-weight:700;margin-top:2px}
    .fin{border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:16px}
    .fin table{width:100%}
    .fin td{padding:3px 6px}
    .fin .row-total td{font-weight:700;border-top:2px solid #1d4ed8;color:#1d4ed8;font-size:13px;padding-top:6px}
    table.items{width:100%;border-collapse:collapse;font-size:9.5px}
    table.items th{background:#1d4ed8;color:#fff;padding:5px 6px;text-align:left}
    table.items td{padding:4px 6px;border-bottom:1px solid #f3f4f6}
    table.items tr:nth-child(even) td{background:#f9fafb}
    table.items .stage-row td{background:#eff6ff;font-size:10px;padding:5px 6px}
    .num{text-align:right;font-variant-numeric:tabular-nums}
    .sig{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:40px}
    .sig-line{border-top:1px solid #374151;padding-top:5px;text-align:center;font-size:9px;color:#6b7280;margin-top:60px}
    @media print{body{padding:8mm}}
  </style>
</head>
<body>
  <div class="hdr">
    <div>
      <h1>Certificado de Obra #${cert.number}</h1>
      <p style="color:#6b7280;margin-top:4px">${cert.code} &nbsp;|&nbsp; ${cert.project?.name || ''}</p>
      <p style="color:#6b7280;margin-top:2px">Presupuesto: ${cert.budgetVersion?.code || ''} — ${cert.budgetVersion?.name || ''}</p>
    </div>
    <div style="text-align:right">
      <span class="badge">${STATUS[cert.status] || cert.status}</span>
      <p style="margin-top:6px;color:#6b7280;font-size:10px">Generado: ${new Date().toLocaleDateString('es-AR')}</p>
      ${cert.approvedAt ? `<p style="color:#6b7280;font-size:10px">Aprobado: ${dateStr(cert.approvedAt)}</p>` : ''}
    </div>
  </div>

  <div class="grid4">
    <div class="card">
      <div class="card-label">Período</div>
      <div class="card-value" style="font-size:12px">${dateStr(cert.periodStart)}<br>→ ${dateStr(cert.periodEnd)}</div>
    </div>
    <div class="card">
      <div class="card-label">Subtotal Período</div>
      <div class="card-value">$${fmt(Number(cert.subtotal))}</div>
    </div>
    <div class="card">
      <div class="card-label">Factor de Ajuste</div>
      <div class="card-value">${Number(cert.adjustmentFactor).toFixed(4)}</div>
    </div>
    <div class="card" style="border-color:#1d4ed8">
      <div class="card-label">Total Certificado</div>
      <div class="card-value" style="color:#1d4ed8">$${fmt(Number(cert.totalAmount))}</div>
    </div>
  </div>

  <h2>Resumen Financiero</h2>
  <div class="fin">
    <table>
      <tr><td>Subtotal del período</td><td class="num">$${fmt(Number(cert.subtotal))}</td></tr>
      <tr><td style="color:#dc2626">(-) Acopio (${pct(Number(cert.acopioPct))})</td><td class="num" style="color:#dc2626">-$${fmt(Number(cert.acopioAmount))}</td></tr>
      <tr><td style="color:#dc2626">(-) Anticipo Financiero (${pct(Number(cert.anticipoPct))})</td><td class="num" style="color:#dc2626">-$${fmt(Number(cert.anticipoAmount))}</td></tr>
      <tr><td style="color:#dc2626">(-) Fondo de Reparo (${pct(Number(cert.fondoReparoPct))})</td><td class="num" style="color:#dc2626">-$${fmt(Number(cert.fondoReparoAmount))}</td></tr>
      <tr><td>= Neto antes de ajuste</td><td class="num">$${fmt(netBeforeAdj)}</td></tr>
      <tr><td>(×) Factor de Ajuste (${Number(cert.adjustmentFactor).toFixed(4)})</td><td class="num">$${fmt(netAdj)}</td></tr>
      <tr><td style="color:#16a34a">(+) IVA (${pct(Number(cert.ivaPct))})</td><td class="num" style="color:#16a34a">+$${fmt(Number(cert.ivaAmount))}</td></tr>
      <tr class="row-total"><td>TOTAL CERTIFICADO</td><td class="num">$${fmt(Number(cert.totalAmount))}</td></tr>
    </table>
  </div>

  <h2>Detalle de Ítems</h2>
  <table class="items">
    <thead>
      <tr>
        <th>Nro</th><th>Descripción</th><th>Ud</th><th class="num">Cant.</th>
        <th class="num">P.U.</th><th class="num">Av.Ant.</th><th class="num">Av.Per.</th>
        <th class="num">Av.Total</th><th class="num">Acopio</th><th class="num">Monto Per.</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr style="background:#eff6ff;font-weight:700">
        <td colspan="9" style="text-align:right;padding:5px 6px">TOTAL PERÍODO</td>
        <td class="num" style="padding:5px 6px">$${fmt(Number(cert.subtotal))}</td>
      </tr>
    </tfoot>
  </table>

  <div class="sig">
    <div><div class="sig-line">Inspector de Obra</div></div>
    <div><div class="sig-line">Contratista</div></div>
    <div><div class="sig-line">Comitente</div></div>
  </div>
</body>
</html>`;
  }

  /**
   * Generar CSV de certificado para Excel.
   */
  async exportCsv(id: string, organizationId: string): Promise<string> {
    const cert = await this.findById(id, organizationId);

    const STATUS: Record<string, string> = {
      DRAFT: 'Borrador', SUBMITTED: 'Presentado', APPROVED: 'Aprobado', PAID: 'Pagado',
    };
    const num = (n: number) => Number(n).toFixed(2);
    const pct = (n: number) => (Number(n) * 100).toFixed(4);
    const d = (v: Date | string) => new Date(v).toLocaleDateString('es-AR');

    const netBeforeAdj = Number(cert.subtotal)
      - Number(cert.acopioAmount)
      - Number(cert.anticipoAmount)
      - Number(cert.fondoReparoAmount);

    const rows: (string | number)[][] = [
      ['CERTIFICADO DE OBRA'],
      ['Código', cert.code],
      ['Número', cert.number],
      ['Proyecto', cert.project?.name || ''],
      ['Código Proyecto', cert.project?.code || ''],
      ['Estado', STATUS[cert.status] || cert.status],
      ['Período desde', d(cert.periodStart)],
      ['Período hasta', d(cert.periodEnd)],
      cert.approvedAt ? ['Aprobado el', d(cert.approvedAt)] : ['Aprobado el', '-'],
      [],
      ['RESUMEN FINANCIERO'],
      ['Concepto', 'Porcentaje', 'Monto ARS'],
      ['Subtotal del período', '', num(Number(cert.subtotal))],
      ['Acopio', pct(Number(cert.acopioPct)) + '%', '-' + num(Number(cert.acopioAmount))],
      ['Anticipo Financiero', pct(Number(cert.anticipoPct)) + '%', '-' + num(Number(cert.anticipoAmount))],
      ['Fondo de Reparo', pct(Number(cert.fondoReparoPct)) + '%', '-' + num(Number(cert.fondoReparoAmount))],
      ['Neto antes de ajuste', '', num(netBeforeAdj)],
      ['Factor de Ajuste', Number(cert.adjustmentFactor).toFixed(4), ''],
      ['IVA', pct(Number(cert.ivaPct)) + '%', '+' + num(Number(cert.ivaAmount))],
      ['TOTAL CERTIFICADO', '', num(Number(cert.totalAmount))],
      [],
      ['DETALLE DE ÍTEMS'],
      ['Nro', 'Descripción', 'Unidad', 'Cantidad', 'P.U. ARS', 'Av.Anterior %', 'Av.Período %', 'Av.Total %', 'Acopio ARS', 'Monto Período ARS', 'Monto Acumulado ARS'],
      ...cert.items.map((item) => [
        item.itemNumber,
        item.description,
        item.unit,
        num(Number(item.quantity)),
        num(Number(item.unitPrice)),
        pct(Number(item.previousAdvance)),
        pct(Number(item.currentAdvance)),
        pct(Number(item.totalAdvance)),
        num(Number(item.currentAmount) * Number(cert.acopioPct)),
        num(Number(item.currentAmount)),
        num(Number(item.totalAmount)),
      ]),
    ];

    return rows
      .map((row) =>
        row.map((cell) => {
          const s = String(cell ?? '');
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        }).join(',')
      )
      .join('\n');
  }

  /**
   * Eliminar certificado (soft delete). Solo permitido en estado DRAFT.
   */
  async delete(id: string, organizationId: string) {
    const certificate = await this.findById(id, organizationId);

    if (certificate.status !== 'DRAFT') {
      throw new ConflictError('Solo se pueden eliminar certificados en estado Borrador');
    }

    await prisma.certificate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const certificatesService = new CertificatesService();
