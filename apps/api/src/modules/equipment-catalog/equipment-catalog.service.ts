import { prisma } from '@construccion/database';
import { NotFoundError, ConflictError } from '../../shared/utils/errors';

class EquipmentCatalogService {
  /**
   * Calcula los componentes de costo horario del equipo:
   * - amortPerHour = (newValue × (1 - residualPct)) / usefulLifeHours
   * - repairsPerHour = amortPerHour × 0.75 (estándar industria)
   * - totalHourlyCost = amortPerHour + repairsPerHour + fuelPerHour + lubricantsPerHour
   */
  private calculateCosts(data: {
    newValue: number;
    residualPct: number;
    usefulLifeHours: number;
    fuelPerHour: number;
    lubricantsPerHour: number;
  }) {
    const amortPerHour = (data.newValue * (1 - data.residualPct)) / data.usefulLifeHours;
    const repairsPerHour = amortPerHour * 0.75;
    const totalHourlyCost =
      amortPerHour + repairsPerHour + data.fuelPerHour + data.lubricantsPerHour;
    return {
      amortPerHour: parseFloat(amortPerHour.toFixed(2)),
      repairsPerHour: parseFloat(repairsPerHour.toFixed(2)),
      totalHourlyCost: parseFloat(totalHourlyCost.toFixed(2)),
    };
  }

  async create(
    data: {
      code: string;
      name: string;
      description?: string;
      powerHp?: number;
      newValue: number;
      residualPct?: number;
      usefulLifeHours?: number;
      fuelPerHour?: number;
      lubricantsPerHour?: number;
    },
    organizationId: string
  ) {
    // Verificar código duplicado en la organización
    const existing = await prisma.equipmentCatalogItem.findFirst({
      where: { code: data.code, organizationId, deletedAt: null },
    });
    if (existing) {
      throw new ConflictError(
        `Ya existe un equipo en el catálogo con el código "${data.code}"`
      );
    }

    const residualPct = data.residualPct ?? 0.1;
    const usefulLifeHours = data.usefulLifeHours ?? 10000;
    const fuelPerHour = data.fuelPerHour ?? 0;
    const lubricantsPerHour = data.lubricantsPerHour ?? 0;

    const costs = this.calculateCosts({
      newValue: data.newValue,
      residualPct,
      usefulLifeHours,
      fuelPerHour,
      lubricantsPerHour,
    });

    return prisma.equipmentCatalogItem.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        powerHp: data.powerHp,
        newValue: data.newValue,
        residualPct,
        usefulLifeHours,
        fuelPerHour,
        lubricantsPerHour,
        amortPerHour: costs.amortPerHour,
        repairsPerHour: costs.repairsPerHour,
        totalHourlyCost: costs.totalHourlyCost,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string) {
    return prisma.equipmentCatalogItem.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        _count: { select: { analysisEquipment: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findById(id: string, organizationId: string) {
    const item = await prisma.equipmentCatalogItem.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        _count: { select: { analysisEquipment: true } },
      },
    });

    if (!item) {
      throw new NotFoundError('Equipo no encontrado en el catálogo');
    }

    return item;
  }

  async update(
    id: string,
    data: {
      code?: string;
      name?: string;
      description?: string;
      powerHp?: number;
      newValue?: number;
      residualPct?: number;
      usefulLifeHours?: number;
      fuelPerHour?: number;
      lubricantsPerHour?: number;
    },
    organizationId: string
  ) {
    const existing = await prisma.equipmentCatalogItem.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundError('Equipo no encontrado en el catálogo');
    }

    // Verificar código duplicado si se está actualizando
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.equipmentCatalogItem.findFirst({
        where: { code: data.code, organizationId, deletedAt: null, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictError(`Ya existe un equipo con el código "${data.code}"`);
      }
    }

    // Recalcular costos con valores mergeados
    const newValue = data.newValue ?? Number(existing.newValue);
    const residualPct = data.residualPct ?? Number(existing.residualPct);
    const usefulLifeHours = data.usefulLifeHours ?? Number(existing.usefulLifeHours);
    const fuelPerHour = data.fuelPerHour ?? Number(existing.fuelPerHour);
    const lubricantsPerHour = data.lubricantsPerHour ?? Number(existing.lubricantsPerHour);

    const costs = this.calculateCosts({
      newValue,
      residualPct,
      usefulLifeHours,
      fuelPerHour,
      lubricantsPerHour,
    });

    return prisma.equipmentCatalogItem.update({
      where: { id },
      data: {
        ...data,
        amortPerHour: costs.amortPerHour,
        repairsPerHour: costs.repairsPerHour,
        totalHourlyCost: costs.totalHourlyCost,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const item = await prisma.equipmentCatalogItem.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!item) {
      throw new NotFoundError('Equipo no encontrado en el catálogo');
    }

    await prisma.equipmentCatalogItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const equipmentCatalogService = new EquipmentCatalogService();
