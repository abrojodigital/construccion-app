import { prisma, Prisma } from '@construccion/database';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';
import { generateSimpleCode } from '../../shared/utils/code-generator';
import { budgetVersionsService } from '../budget-versions/budget-versions.service';

// ============================================
// Tipos de sub-ítem válidos
// ============================================

const SUB_ITEM_TABLES = {
  materials: 'analysisMaterial',
  labor: 'analysisLabor',
  equipment: 'analysisEquipment',
  transport: 'analysisTransport',
} as const;

type SubItemType = keyof typeof SUB_ITEM_TABLES;

// ============================================
// Service
// ============================================

export class PriceAnalysisService {
  /**
   * Verifica que el análisis de precios pertenece a la organización
   * Recorre la cadena: PriceAnalysis -> BudgetItem -> BudgetStage -> BudgetCategory -> BudgetVersion -> organizationId
   */
  private async verifyOwnership(priceAnalysisId: string, organizationId: string) {
    const pa = await prisma.priceAnalysis.findFirst({
      where: {
        id: priceAnalysisId,
        organizationId,
      },
      include: {
        budgetItem: {
          include: {
            stage: {
              include: {
                category: {
                  include: {
                    budgetVersion: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pa) {
      throw new NotFoundError('Análisis de precios', priceAnalysisId);
    }

    return pa;
  }

  /**
   * Verifica que la versión de presupuesto esté en estado DRAFT
   */
  private verifyDraftStatus(status: string): void {
    if (status !== 'DRAFT') {
      throw new ValidationError(
        'Solo se pueden modificar análisis de precios de versiones en estado Borrador'
      );
    }
  }

  /**
   * Recalcula todos los subtotales del análisis de precios y actualiza el ítem padre
   *
   * Secciones:
   * A = Materiales
   * B = Mano de obra
   * C = Transporte
   * D = Amortización e intereses de equipos
   * E = Reparaciones de equipos
   * F = Combustibles y lubricantes de equipos
   */
  async recalculateTotals(priceAnalysisId: string): Promise<void> {
    // 1. Materiales (sección A)
    const materials = await prisma.analysisMaterial.findMany({
      where: { priceAnalysisId },
    });
    const totalMaterials = materials.reduce(
      (sum, m) => sum.add(m.totalCost),
      new Prisma.Decimal(0)
    );

    // 2. Mano de obra (sección B)
    const laborItems = await prisma.analysisLabor.findMany({
      where: { priceAnalysisId },
    });
    const totalLabor = laborItems.reduce(
      (sum, l) => sum.add(l.totalCost),
      new Prisma.Decimal(0)
    );

    // 3. Transporte (sección C)
    const transport = await prisma.analysisTransport.findMany({
      where: { priceAnalysisId },
    });
    const totalTransport = transport.reduce(
      (sum, t) => sum.add(t.totalCost),
      new Prisma.Decimal(0)
    );

    // 4. Equipos - obtener todos para calcular D, E, F
    const equipment = await prisma.analysisEquipment.findMany({
      where: { priceAnalysisId },
    });

    // D: Amortización e intereses (section='D' o 'DEF')
    let totalEquipAmort = new Prisma.Decimal(0);
    for (const eq of equipment) {
      if (eq.section === 'D' || eq.section === 'DEF') {
        totalEquipAmort = totalEquipAmort.add(eq.totalCost);
      }
    }

    // E: Reparaciones (section='E' o 'DEF') -> repairsCost * hoursUsed
    let totalRepairs = new Prisma.Decimal(0);
    for (const eq of equipment) {
      if (eq.section === 'E' || eq.section === 'DEF') {
        totalRepairs = totalRepairs.add(eq.repairsCost.mul(eq.hoursUsed));
      }
    }

    // F: Combustibles y lubricantes (section='F' o 'DEF') -> (fuelCost + lubricantsCost) * hoursUsed
    let totalFuel = new Prisma.Decimal(0);
    for (const eq of equipment) {
      if (eq.section === 'F' || eq.section === 'DEF') {
        const fuelLub = eq.fuelCost.add(eq.lubricantsCost);
        totalFuel = totalFuel.add(fuelLub.mul(eq.hoursUsed));
      }
    }

    // 7. Costo directo total = A + B + C + D + E + F
    const totalDirect = totalMaterials
      .add(totalLabor)
      .add(totalTransport)
      .add(totalEquipAmort)
      .add(totalRepairs)
      .add(totalFuel);

    // 8. Actualizar PriceAnalysis
    const pa = await prisma.priceAnalysis.update({
      where: { id: priceAnalysisId },
      data: {
        totalMaterials,
        totalLabor,
        totalTransport,
        totalEquipAmort,
        totalRepairs,
        totalFuel,
        totalDirect,
      },
    });

    // 9. Actualizar unitPrice del ítem padre: totalDirect / quantity (si quantity > 0)
    const budgetItem = await prisma.budgetItem.findUnique({
      where: { id: pa.budgetItemId },
    });

    if (budgetItem && Number(budgetItem.quantity) > 0) {
      const unitPrice = totalDirect.div(budgetItem.quantity);
      const totalPrice = unitPrice.mul(budgetItem.quantity);

      await prisma.budgetItem.update({
        where: { id: budgetItem.id },
        data: { unitPrice, totalPrice },
      });
    }

    // 10. Recalcular totales de la versión de presupuesto padre
    const item = await prisma.budgetItem.findUnique({
      where: { id: pa.budgetItemId },
      include: { stage: { include: { category: true } } },
    });

    if (item) {
      await budgetVersionsService.recalculateTotals(item.stage.category.budgetVersionId);
    }
  }

  // ============================================
  // Consulta
  // ============================================

  /**
   * Obtiene el análisis de precios de un ítem de presupuesto con todos sus sub-ítems
   */
  async findByBudgetItem(budgetItemId: string, organizationId: string) {
    const pa = await prisma.priceAnalysis.findFirst({
      where: {
        budgetItemId,
        organizationId,
      },
      include: {
        materials: true,
        laborItems: true,
        transport: true,
        equipment: true,
        budgetItem: {
          select: {
            id: true,
            number: true,
            description: true,
            unit: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
          },
        },
      },
    });

    if (!pa) {
      throw new NotFoundError('Análisis de precios para el ítem', budgetItemId);
    }

    return pa;
  }

  // ============================================
  // Crear / Eliminar análisis
  // ============================================

  /**
   * Crea un análisis de precios vacío para un ítem de presupuesto
   * Verifica que el ítem exista y que la versión esté en DRAFT
   */
  async create(budgetItemId: string, organizationId: string) {
    // Verificar que el ítem existe y pertenece a la organización
    const budgetItem = await prisma.budgetItem.findFirst({
      where: { id: budgetItemId },
      include: {
        stage: {
          include: {
            category: {
              include: {
                budgetVersion: true,
              },
            },
          },
        },
        priceAnalysis: true,
      },
    });

    if (!budgetItem) {
      throw new NotFoundError('Ítem de presupuesto', budgetItemId);
    }

    if (budgetItem.stage.category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Ítem de presupuesto', budgetItemId);
    }

    // Verificar estado DRAFT
    this.verifyDraftStatus(budgetItem.stage.category.budgetVersion.status);

    // Verificar que no exista ya un análisis para este ítem
    if (budgetItem.priceAnalysis) {
      throw new ValidationError('El ítem ya tiene un análisis de precios asociado');
    }

    // Generar código
    const code = await generateSimpleCode('priceAnalysis', organizationId);

    // Crear análisis vacío
    const pa = await prisma.priceAnalysis.create({
      data: {
        code,
        budgetItemId,
        organizationId,
      },
      include: {
        materials: true,
        laborItems: true,
        transport: true,
        equipment: true,
        budgetItem: {
          select: {
            id: true,
            number: true,
            description: true,
            unit: true,
            quantity: true,
          },
        },
      },
    });

    return pa;
  }

  /**
   * Elimina un análisis de precios completo (solo si la versión está en DRAFT)
   */
  async delete(id: string, organizationId: string): Promise<void> {
    const pa = await this.verifyOwnership(id, organizationId);
    this.verifyDraftStatus(pa.budgetItem.stage.category.budgetVersion.status);

    const budgetVersionId = pa.budgetItem.stage.category.budgetVersionId;

    // Resetear unitPrice del ítem padre
    await prisma.budgetItem.update({
      where: { id: pa.budgetItemId },
      data: { unitPrice: 0, totalPrice: 0 },
    });

    // Eliminar el análisis (cascade eliminará sub-ítems)
    await prisma.priceAnalysis.delete({ where: { id } });

    // Recalcular totales de la versión
    await budgetVersionsService.recalculateTotals(budgetVersionId);
  }

  // ============================================
  // Agregar sub-ítems
  // ============================================

  /**
   * Agrega un material al análisis de precios
   * totalCost = quantity * unitCost * (1 + wastePct)
   */
  async addMaterial(
    priceAnalysisId: string,
    data: {
      description: string;
      indecCode?: string;
      unit: string;
      quantity: number;
      unitCost: number;
      wastePct?: number;
      currencyId?: string;
      exchangeRate?: number;
    },
    organizationId: string
  ) {
    const pa = await this.verifyOwnership(priceAnalysisId, organizationId);
    this.verifyDraftStatus(pa.budgetItem.stage.category.budgetVersion.status);

    const wastePct = data.wastePct || 0;
    const totalCost = data.quantity * data.unitCost * (1 + wastePct);

    const material = await prisma.analysisMaterial.create({
      data: {
        description: data.description,
        indecCode: data.indecCode,
        unit: data.unit,
        quantity: data.quantity,
        unitCost: data.unitCost,
        wastePct,
        totalCost,
        currencyId: data.currencyId,
        exchangeRate: data.exchangeRate,
        priceAnalysisId,
      },
    });

    await this.recalculateTotals(priceAnalysisId);

    return material;
  }

  /**
   * Agrega mano de obra al análisis de precios
   * totalCost = quantity * hourlyRate
   */
  async addLabor(
    priceAnalysisId: string,
    data: {
      category: string;
      quantity: number;
      hourlyRate: number;
      baseSalary?: number;
      attendancePct?: number;
      socialChargesPct?: number;
      artPct?: number;
    },
    organizationId: string
  ) {
    const pa = await this.verifyOwnership(priceAnalysisId, organizationId);
    this.verifyDraftStatus(pa.budgetItem.stage.category.budgetVersion.status);

    const totalCost = data.quantity * data.hourlyRate;

    const labor = await prisma.analysisLabor.create({
      data: {
        category: data.category,
        quantity: data.quantity,
        hourlyRate: data.hourlyRate,
        totalCost,
        baseSalary: data.baseSalary,
        attendancePct: data.attendancePct,
        socialChargesPct: data.socialChargesPct,
        artPct: data.artPct,
        priceAnalysisId,
      },
    });

    await this.recalculateTotals(priceAnalysisId);

    return labor;
  }

  /**
   * Agrega equipo al análisis de precios
   * hourlyTotal = amortInterest + repairsCost + fuelCost + lubricantsCost
   * totalCost = hoursUsed * hourlyTotal
   */
  async addEquipment(
    priceAnalysisId: string,
    data: {
      description: string;
      powerHp?: number;
      newValue?: number;
      residualPct?: number;
      amortInterest?: number;
      repairsCost?: number;
      fuelCost?: number;
      lubricantsCost?: number;
      hoursUsed: number;
      section?: string;
      currencyId?: string;
      exchangeRate?: number;
    },
    organizationId: string
  ) {
    const pa = await this.verifyOwnership(priceAnalysisId, organizationId);
    this.verifyDraftStatus(pa.budgetItem.stage.category.budgetVersion.status);

    const amortInterest = data.amortInterest || 0;
    const repairsCost = data.repairsCost || 0;
    const fuelCost = data.fuelCost || 0;
    const lubricantsCost = data.lubricantsCost || 0;

    const hourlyTotal = amortInterest + repairsCost + fuelCost + lubricantsCost;
    const totalCost = data.hoursUsed * hourlyTotal;

    const equipment = await prisma.analysisEquipment.create({
      data: {
        description: data.description,
        powerHp: data.powerHp,
        newValue: data.newValue,
        residualPct: data.residualPct,
        amortInterest,
        repairsCost,
        fuelCost,
        lubricantsCost,
        hourlyTotal,
        hoursUsed: data.hoursUsed,
        totalCost,
        section: data.section || 'D',
        currencyId: data.currencyId,
        exchangeRate: data.exchangeRate,
        priceAnalysisId,
      },
    });

    await this.recalculateTotals(priceAnalysisId);

    return equipment;
  }

  /**
   * Agrega transporte al análisis de precios
   * totalCost = quantity * unitCost
   */
  async addTransport(
    priceAnalysisId: string,
    data: {
      description: string;
      unit: string;
      quantity: number;
      unitCost: number;
    },
    organizationId: string
  ) {
    const pa = await this.verifyOwnership(priceAnalysisId, organizationId);
    this.verifyDraftStatus(pa.budgetItem.stage.category.budgetVersion.status);

    const totalCost = data.quantity * data.unitCost;

    const transportItem = await prisma.analysisTransport.create({
      data: {
        description: data.description,
        unit: data.unit,
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost,
        priceAnalysisId,
      },
    });

    await this.recalculateTotals(priceAnalysisId);

    return transportItem;
  }

  // ============================================
  // Eliminar sub-ítems
  // ============================================

  /**
   * Elimina un sub-ítem genérico (material, mano de obra, equipo o transporte)
   */
  async removeItem(
    type: string,
    itemId: string,
    priceAnalysisId: string,
    organizationId: string
  ): Promise<void> {
    if (!SUB_ITEM_TABLES[type as SubItemType]) {
      throw new ValidationError(
        `Tipo de sub-ítem inválido: ${type}. Valores válidos: ${Object.keys(SUB_ITEM_TABLES).join(', ')}`
      );
    }

    const pa = await this.verifyOwnership(priceAnalysisId, organizationId);
    this.verifyDraftStatus(pa.budgetItem.stage.category.budgetVersion.status);

    const modelName = SUB_ITEM_TABLES[type as SubItemType];

    // Verificar que el sub-ítem existe y pertenece al análisis
    const item = await (prisma[modelName] as any).findFirst({
      where: { id: itemId, priceAnalysisId },
    });

    if (!item) {
      throw new NotFoundError(`Sub-ítem de ${type}`, itemId);
    }

    await (prisma[modelName] as any).delete({ where: { id: itemId } });

    await this.recalculateTotals(priceAnalysisId);
  }
}

export const priceAnalysisService = new PriceAnalysisService();
