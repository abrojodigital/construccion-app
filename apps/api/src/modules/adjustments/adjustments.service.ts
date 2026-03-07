import { prisma, Prisma } from '@construccion/database';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';

class AdjustmentsService {
  // ============================================
  // ÍNDICES DE PRECIOS
  // ============================================

  async createIndex(
    data: { name: string; code: string; source?: string },
    organizationId: string
  ) {
    // Verificar que no exista un índice con el mismo código
    const existing = await prisma.priceIndex.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ValidationError(`Ya existe un índice con el código "${data.code}"`);
    }

    return prisma.priceIndex.create({
      data: {
        name: data.name,
        code: data.code,
        source: data.source,
        organizationId,
      },
      include: {
        _count: { select: { values: true } },
      },
    });
  }

  async findAllIndices(organizationId: string) {
    return prisma.priceIndex.findMany({
      where: { organizationId },
      include: {
        _count: { select: { values: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findIndexById(id: string, organizationId: string) {
    const index = await prisma.priceIndex.findFirst({
      where: { id, organizationId },
      include: {
        values: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    });

    if (!index) {
      throw new NotFoundError('Índice de precios no encontrado');
    }

    return index;
  }

  async addIndexValue(
    indexId: string,
    data: { date: Date; value: number },
    organizationId: string
  ) {
    // Verificar que el índice pertenece a la organización
    const index = await prisma.priceIndex.findFirst({
      where: { id: indexId, organizationId },
    });
    if (!index) {
      throw new NotFoundError('Índice de precios no encontrado');
    }

    // Upsert: si ya existe un valor para esa fecha, actualizarlo
    return prisma.priceIndexValue.upsert({
      where: {
        priceIndexId_date: {
          priceIndexId: indexId,
          date: data.date,
        },
      },
      update: {
        value: data.value,
      },
      create: {
        priceIndexId: indexId,
        date: data.date,
        value: data.value,
      },
    });
  }

  async deleteIndex(id: string, organizationId: string) {
    const index = await prisma.priceIndex.findFirst({
      where: { id, organizationId },
      include: { _count: { select: { values: true } } },
    });
    if (!index) {
      throw new NotFoundError('Índice de precios no encontrado');
    }

    // Eliminar valores y luego el índice
    await prisma.$transaction([
      prisma.priceIndexValue.deleteMany({ where: { priceIndexId: id } }),
      prisma.priceIndex.delete({ where: { id } }),
    ]);
  }

  // ============================================
  // FÓRMULAS DE AJUSTE
  // ============================================

  async createFormula(
    data: {
      name: string;
      budgetVersionId: string;
      weights: Array<{ component: string; weight: number; priceIndexId: string }>;
    },
    organizationId: string
  ) {
    // Verificar que la versión de presupuesto pertenece a la organización
    const budgetVersion = await prisma.budgetVersion.findFirst({
      where: { id: data.budgetVersionId, organizationId },
    });
    if (!budgetVersion) {
      throw new NotFoundError('Versión de presupuesto no encontrada');
    }

    // Verificar que todos los índices existen y pertenecen a la organización
    const indexIds = data.weights.map((w) => w.priceIndexId);
    const indices = await prisma.priceIndex.findMany({
      where: { id: { in: indexIds }, organizationId },
    });
    if (indices.length !== indexIds.length) {
      throw new ValidationError('Uno o más índices de precios no encontrados');
    }

    // Validar que la suma de pesos sea aproximadamente 1.0
    const totalWeight = data.weights.reduce((sum, w) => sum + w.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new ValidationError(
        `La suma de pesos debe ser 1.0 (actual: ${totalWeight.toFixed(4)})`
      );
    }

    return prisma.adjustmentFormula.create({
      data: {
        name: data.name,
        budgetVersionId: data.budgetVersionId,
        organizationId,
        weights: {
          create: data.weights.map((w) => ({
            component: w.component,
            weight: w.weight,
            priceIndexId: w.priceIndexId,
          })),
        },
      },
      include: {
        weights: {
          include: {
            priceIndex: { select: { id: true, name: true, code: true } },
          },
        },
        budgetVersion: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findAllFormulas(organizationId: string) {
    return prisma.adjustmentFormula.findMany({
      where: { organizationId },
      include: {
        weights: {
          include: {
            priceIndex: { select: { id: true, name: true, code: true } },
          },
        },
        budgetVersion: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFormulaById(id: string, organizationId: string) {
    const formula = await prisma.adjustmentFormula.findFirst({
      where: { id, organizationId },
      include: {
        weights: {
          include: {
            priceIndex: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        budgetVersion: { select: { id: true, name: true, code: true, status: true } },
      },
    });

    if (!formula) {
      throw new NotFoundError('Fórmula de ajuste no encontrada');
    }

    return formula;
  }

  async deleteFormula(id: string, organizationId: string) {
    const formula = await prisma.adjustmentFormula.findFirst({
      where: { id, organizationId },
    });
    if (!formula) {
      throw new NotFoundError('Fórmula de ajuste no encontrada');
    }

    await prisma.$transaction([
      prisma.adjustmentWeight.deleteMany({ where: { formulaId: id } }),
      prisma.adjustmentFormula.delete({ where: { id } }),
    ]);
  }

  // ============================================
  // CÁLCULO DE REDETERMINACIÓN
  // ============================================

  async calculateFactor(
    data: { formulaId: string; baseDate: Date; currentDate: Date },
    organizationId: string
  ) {
    const formula = await prisma.adjustmentFormula.findFirst({
      where: { id: data.formulaId, organizationId },
      include: {
        weights: {
          include: {
            priceIndex: true,
          },
        },
      },
    });

    if (!formula) {
      throw new NotFoundError('Fórmula de ajuste no encontrada');
    }

    const details: Array<{
      component: string;
      weight: number;
      indexName: string;
      indexCode: string;
      baseValue: number;
      baseDate: string;
      currentValue: number;
      currentDate: string;
      ratio: number;
      contribution: number;
    }> = [];

    let factor = 0;

    for (const weight of formula.weights) {
      // Obtener valor del índice más cercano a la fecha base (<=)
      const baseValue = await prisma.priceIndexValue.findFirst({
        where: {
          priceIndexId: weight.priceIndexId,
          date: { lte: data.baseDate },
        },
        orderBy: { date: 'desc' },
      });

      if (!baseValue) {
        throw new ValidationError(
          `No se encontró valor del índice "${weight.priceIndex.name}" para la fecha base ${data.baseDate.toISOString().split('T')[0]}`
        );
      }

      // Obtener valor del índice más cercano a la fecha actual (<=)
      const currentValue = await prisma.priceIndexValue.findFirst({
        where: {
          priceIndexId: weight.priceIndexId,
          date: { lte: data.currentDate },
        },
        orderBy: { date: 'desc' },
      });

      if (!currentValue) {
        throw new ValidationError(
          `No se encontró valor del índice "${weight.priceIndex.name}" para la fecha actual ${data.currentDate.toISOString().split('T')[0]}`
        );
      }

      const baseVal = new Prisma.Decimal(baseValue.value.toString()).toNumber();
      const currentVal = new Prisma.Decimal(currentValue.value.toString()).toNumber();
      const weightVal = new Prisma.Decimal(weight.weight.toString()).toNumber();

      if (baseVal === 0) {
        throw new ValidationError(
          `El valor base del índice "${weight.priceIndex.name}" es cero, no se puede calcular el ratio`
        );
      }

      const ratio = currentVal / baseVal;
      const contribution = weightVal * ratio;
      factor += contribution;

      details.push({
        component: weight.component,
        weight: weightVal,
        indexName: weight.priceIndex.name,
        indexCode: weight.priceIndex.code,
        baseValue: baseVal,
        baseDate: baseValue.date.toISOString().split('T')[0],
        currentValue: currentVal,
        currentDate: currentValue.date.toISOString().split('T')[0],
        ratio: parseFloat(ratio.toFixed(6)),
        contribution: parseFloat(contribution.toFixed(6)),
      });
    }

    return {
      formulaId: formula.id,
      formulaName: formula.name,
      baseDate: data.baseDate.toISOString().split('T')[0],
      currentDate: data.currentDate.toISOString().split('T')[0],
      factor: parseFloat(factor.toFixed(6)),
      variationPct: parseFloat(((factor - 1) * 100).toFixed(2)),
      details,
    };
  }
}

export const adjustmentsService = new AdjustmentsService();
