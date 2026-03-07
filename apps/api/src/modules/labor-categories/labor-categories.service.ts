import { prisma } from '@construccion/database';
import { NotFoundError, ConflictError } from '../../shared/utils/errors';

class LaborCategoriesService {
  /**
   * Calcula el costo horario total:
   * totalHourlyCost = baseSalaryPerHour × (1 + attendancePct) × (1 + socialChargesPct) × (1 + artPct)
   */
  private calculateTotalHourlyCost(data: {
    baseSalaryPerHour: number;
    attendancePct: number;
    socialChargesPct: number;
    artPct: number;
  }): number {
    const total =
      data.baseSalaryPerHour *
      (1 + data.attendancePct) *
      (1 + data.socialChargesPct) *
      (1 + data.artPct);
    return parseFloat(total.toFixed(2));
  }

  async create(
    data: {
      code: string;
      name: string;
      description?: string;
      baseSalaryPerHour: number;
      attendancePct?: number;
      socialChargesPct?: number;
      artPct?: number;
    },
    organizationId: string
  ) {
    // Verificar código duplicado en la organización
    const existing = await prisma.laborCategory.findFirst({
      where: { code: data.code, organizationId, deletedAt: null },
    });
    if (existing) {
      throw new ConflictError(
        `Ya existe una categoría de mano de obra con el código "${data.code}"`
      );
    }

    const attendancePct = data.attendancePct ?? 0.2;
    const socialChargesPct = data.socialChargesPct ?? 0.55;
    const artPct = data.artPct ?? 0.079;

    const totalHourlyCost = this.calculateTotalHourlyCost({
      baseSalaryPerHour: data.baseSalaryPerHour,
      attendancePct,
      socialChargesPct,
      artPct,
    });

    return prisma.laborCategory.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        baseSalaryPerHour: data.baseSalaryPerHour,
        attendancePct,
        socialChargesPct,
        artPct,
        totalHourlyCost,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string) {
    return prisma.laborCategory.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        _count: { select: { analysisLabor: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    const category = await prisma.laborCategory.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        _count: { select: { analysisLabor: true } },
      },
    });

    if (!category) {
      throw new NotFoundError('Categoría de mano de obra no encontrada');
    }

    return category;
  }

  async update(
    id: string,
    data: {
      code?: string;
      name?: string;
      description?: string;
      baseSalaryPerHour?: number;
      attendancePct?: number;
      socialChargesPct?: number;
      artPct?: number;
    },
    organizationId: string
  ) {
    const existing = await prisma.laborCategory.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError('Categoría de mano de obra no encontrada');
    }

    // Verificar código duplicado si se está actualizando
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.laborCategory.findFirst({
        where: { code: data.code, organizationId, deletedAt: null, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictError(`Ya existe una categoría con el código "${data.code}"`);
      }
    }

    // Recalcular costo horario total con valores mergeados
    const baseSalaryPerHour = data.baseSalaryPerHour ?? Number(existing.baseSalaryPerHour);
    const attendancePct = data.attendancePct ?? Number(existing.attendancePct);
    const socialChargesPct = data.socialChargesPct ?? Number(existing.socialChargesPct);
    const artPct = data.artPct ?? Number(existing.artPct);

    const totalHourlyCost = this.calculateTotalHourlyCost({
      baseSalaryPerHour,
      attendancePct,
      socialChargesPct,
      artPct,
    });

    return prisma.laborCategory.update({
      where: { id },
      data: {
        ...data,
        totalHourlyCost,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const category = await prisma.laborCategory.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundError('Categoría de mano de obra no encontrada');
    }

    await prisma.laborCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const laborCategoriesService = new LaborCategoriesService();
