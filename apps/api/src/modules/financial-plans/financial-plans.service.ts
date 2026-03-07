import { prisma, Prisma } from '@construccion/database';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/utils/errors';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

class FinancialPlansService {
  // ============================================
  // PLANES FINANCIEROS
  // ============================================

  async create(
    data: { name: string; budgetVersionId: string },
    projectId: string,
    organizationId: string
  ) {
    // Verificar que el proyecto pertenezca a la organización
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado');
    }

    // Verificar que la versión de presupuesto pertenezca al proyecto
    const budgetVersion = await prisma.budgetVersion.findFirst({
      where: { id: data.budgetVersionId, projectId, deletedAt: null },
    });
    if (!budgetVersion) {
      throw new NotFoundError('Versión de presupuesto no encontrada en este proyecto');
    }

    return prisma.financialPlan.create({
      data: {
        name: data.name,
        budgetVersionId: data.budgetVersionId,
        projectId,
        organizationId,
      },
      include: {
        budgetVersion: { select: { id: true, name: true, code: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { periods: true } },
      },
    });
  }

  async findAll(organizationId: string, projectId?: string) {
    const where: any = { organizationId, deletedAt: null };
    if (projectId) {
      where.projectId = projectId;
    }

    return prisma.financialPlan.findMany({
      where,
      include: {
        budgetVersion: { select: { id: true, name: true, code: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { periods: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, organizationId: string) {
    const plan = await prisma.financialPlan.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        budgetVersion: { select: { id: true, name: true, code: true } },
        project: { select: { id: true, name: true, code: true } },
        periods: {
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('Plan financiero no encontrado');
    }

    return plan;
  }

  async update(
    id: string,
    data: { name?: string; status?: 'DRAFT' | 'APPROVED' | 'SUPERSEDED' },
    organizationId: string
  ) {
    const plan = await prisma.financialPlan.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!plan) {
      throw new NotFoundError('Plan financiero no encontrado');
    }

    if (plan.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden editar planes en estado BORRADOR');
    }

    return prisma.financialPlan.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        budgetVersion: { select: { id: true, name: true, code: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { periods: true } },
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const plan = await prisma.financialPlan.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!plan) {
      throw new NotFoundError('Plan financiero no encontrado');
    }

    if (plan.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden eliminar planes en estado BORRADOR');
    }

    await prisma.financialPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async approve(id: string, organizationId: string) {
    const plan = await prisma.financialPlan.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { _count: { select: { periods: true } } },
    });
    if (!plan) {
      throw new NotFoundError('Plan financiero no encontrado');
    }

    if (plan.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden aprobar planes en estado BORRADOR');
    }

    if (plan._count.periods === 0) {
      throw new ValidationError('El plan debe tener al menos un período para ser aprobado');
    }

    return prisma.financialPlan.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        budgetVersion: { select: { id: true, name: true, code: true } },
        project: { select: { id: true, name: true } },
        periods: {
          orderBy: [{ year: 'asc' }, { month: 'asc' }],
        },
      },
    });
  }

  // ============================================
  // PERÍODOS FINANCIEROS
  // ============================================

  async addPeriod(
    planId: string,
    data: {
      month: number;
      year: number;
      projectedAmount?: number;
      projectedMaterials?: number;
      projectedLabor?: number;
      projectedEquipment?: number;
      projectedSubcontracts?: number;
      certifiedAmount?: number;
      executedAmount?: number;
      projectedProgress?: number;
      actualProgress?: number;
      notes?: string;
    },
    organizationId: string
  ) {
    const plan = await prisma.financialPlan.findFirst({
      where: { id: planId, organizationId, deletedAt: null },
    });
    if (!plan) {
      throw new NotFoundError('Plan financiero no encontrado');
    }

    if (plan.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden agregar períodos a planes en estado BORRADOR');
    }

    // Generar label automáticamente
    const label = `${MONTH_NAMES[data.month - 1]} ${data.year}`;

    return prisma.financialPeriod.create({
      data: {
        month: data.month,
        year: data.year,
        label,
        projectedAmount: data.projectedAmount ?? 0,
        projectedMaterials: data.projectedMaterials ?? 0,
        projectedLabor: data.projectedLabor ?? 0,
        projectedEquipment: data.projectedEquipment ?? 0,
        projectedSubcontracts: data.projectedSubcontracts ?? 0,
        certifiedAmount: data.certifiedAmount ?? 0,
        executedAmount: data.executedAmount ?? 0,
        projectedProgress: data.projectedProgress ?? 0,
        actualProgress: data.actualProgress ?? 0,
        notes: data.notes,
        financialPlanId: planId,
      },
    });
  }

  async updatePeriod(
    periodId: string,
    data: {
      month?: number;
      year?: number;
      projectedAmount?: number;
      projectedMaterials?: number;
      projectedLabor?: number;
      projectedEquipment?: number;
      projectedSubcontracts?: number;
      certifiedAmount?: number;
      executedAmount?: number;
      projectedProgress?: number;
      actualProgress?: number;
      notes?: string;
    },
    organizationId: string
  ) {
    const period = await prisma.financialPeriod.findFirst({
      where: { id: periodId },
      include: { financialPlan: { select: { organizationId: true, status: true } } },
    });
    if (!period) {
      throw new NotFoundError('Período no encontrado');
    }
    if (period.financialPlan.organizationId !== organizationId) {
      throw new NotFoundError('Período no encontrado');
    }
    if (period.financialPlan.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden editar períodos de planes en estado BORRADOR');
    }

    // Recalcular label si cambió mes o año
    const updateData: any = { ...data };
    if (data.month !== undefined || data.year !== undefined) {
      const month = data.month ?? period.month;
      const year = data.year ?? period.year;
      updateData.label = `${MONTH_NAMES[month - 1]} ${year}`;
    }

    return prisma.financialPeriod.update({
      where: { id: periodId },
      data: updateData,
    });
  }

  async deletePeriod(periodId: string, organizationId: string) {
    const period = await prisma.financialPeriod.findFirst({
      where: { id: periodId },
      include: { financialPlan: { select: { organizationId: true, status: true } } },
    });
    if (!period) {
      throw new NotFoundError('Período no encontrado');
    }
    if (period.financialPlan.organizationId !== organizationId) {
      throw new NotFoundError('Período no encontrado');
    }
    if (period.financialPlan.status !== 'DRAFT') {
      throw new ValidationError('Solo se pueden eliminar períodos de planes en estado BORRADOR');
    }

    await prisma.financialPeriod.delete({ where: { id: periodId } });
  }
}

export const financialPlansService = new FinancialPlansService();
