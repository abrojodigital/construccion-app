import { prisma, Prisma } from '@construccion/database';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';

// ============================================
// Interfaces
// ============================================

interface RegisterProgressInput {
  date: Date;
  advance: number;
  notes?: string;
}

interface ItemProgressDetail {
  budgetItemId: string;
  number: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  advance: number;
  executedAmount: number;
  lastDate: string | null;
}

interface StageProgressSummary {
  stageId: string;
  stageNumber: string;
  description: string;
  advance: number;
  totalBudget: number;
  executedBudget: number;
  items: ItemProgressDetail[];
}

interface CategoryProgressSummary {
  categoryId: string;
  categoryNumber: number;
  name: string;
  advance: number;
  totalBudget: number;
  executedBudget: number;
  stages: StageProgressSummary[];
}

interface ProgressSummaryResult {
  overallAdvance: number;
  totalBudget: number;
  executedBudget: number;
  categories: CategoryProgressSummary[];
}

// ============================================
// Service
// ============================================

export class ProgressService {
  /**
   * Verifica que el BudgetItem existe y pertenece a la organizacion
   * Recorre la cadena: BudgetItem -> BudgetStage -> BudgetCategory -> BudgetVersion -> organizationId
   */
  private async verifyBudgetItemOwnership(budgetItemId: string, organizationId: string) {
    const item = await prisma.budgetItem.findFirst({
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
      },
    });

    if (!item) {
      throw new NotFoundError('Item de presupuesto', budgetItemId);
    }

    if (item.stage.category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Item de presupuesto', budgetItemId);
    }

    return item;
  }

  /**
   * Verifica que la version de presupuesto este en estado DRAFT o APPROVED
   */
  private verifyEditableStatus(status: string): void {
    if (status !== 'DRAFT' && status !== 'APPROVED') {
      throw new ValidationError(
        'Solo se puede registrar avance en versiones en estado Borrador o Aprobado'
      );
    }
  }

  // ============================================
  // Registrar avance (upsert)
  // ============================================

  /**
   * Registra el avance fisico de un item de presupuesto.
   * Si ya existe una entrada para la misma fecha, la actualiza (upsert).
   */
  async registerProgress(
    budgetItemId: string,
    data: RegisterProgressInput,
    userId: string,
    organizationId: string
  ) {
    // Verificar que el item existe y pertenece a la organizacion
    const budgetItem = await this.verifyBudgetItemOwnership(budgetItemId, organizationId);

    // Verificar estado de la version de presupuesto
    this.verifyEditableStatus(budgetItem.stage.category.budgetVersion.status);

    // Validar rango de avance
    if (data.advance < 0 || data.advance > 1) {
      throw new ValidationError('El avance debe estar entre 0 y 1');
    }

    // Upsert: si ya existe entrada para la misma fecha, actualizar
    const progress = await prisma.itemProgress.upsert({
      where: {
        budgetItemId_date: {
          budgetItemId,
          date: data.date,
        },
      },
      create: {
        date: data.date,
        advance: data.advance,
        notes: data.notes,
        budgetItemId,
        registeredById: userId,
      },
      update: {
        advance: data.advance,
        notes: data.notes,
        registeredById: userId,
      },
    });

    return progress;
  }

  // ============================================
  // Historial de avance
  // ============================================

  /**
   * Obtiene el historial de avance de un item de presupuesto ordenado por fecha descendente
   */
  async getHistory(budgetItemId: string, organizationId: string) {
    // Verificar que el item pertenece a la organizacion
    await this.verifyBudgetItemOwnership(budgetItemId, organizationId);

    const history = await prisma.itemProgress.findMany({
      where: { budgetItemId },
      orderBy: { date: 'desc' },
    });

    return history;
  }

  // ============================================
  // Eliminar entrada de avance
  // ============================================

  /**
   * Elimina una entrada de avance fisico.
   * Verifica la pertenencia a la organizacion a traves de la cadena de relaciones.
   */
  async deleteProgress(id: string, organizationId: string): Promise<void> {
    const progress = await prisma.itemProgress.findFirst({
      where: { id },
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

    if (!progress) {
      throw new NotFoundError('Entrada de avance', id);
    }

    if (progress.budgetItem.stage.category.budgetVersion.organizationId !== organizationId) {
      throw new NotFoundError('Entrada de avance', id);
    }

    await prisma.itemProgress.delete({ where: { id } });
  }

  // ============================================
  // Resumen de avance por version de presupuesto
  // ============================================

  /**
   * Calcula el resumen de avance fisico para una version de presupuesto completa.
   * Agrupa por capitulo, calcula promedios ponderados por totalPrice.
   *
   * Retorna:
   * - overallAdvance: promedio ponderado general
   * - totalBudget: suma de totalPrice de todos los items
   * - executedBudget: suma de (totalPrice * advance) de todos los items
   * - categories: detalle por categoría con sus etapas e items
   */
  async getProgressSummary(
    budgetVersionId: string,
    organizationId: string
  ): Promise<ProgressSummaryResult> {
    // Verificar que la version existe y pertenece a la organizacion
    const version = await prisma.budgetVersion.findFirst({
      where: {
        id: budgetVersionId,
        organizationId,
        deletedAt: null,
      },
      include: {
        categories: {
          orderBy: { order: 'asc' },
          include: {
            stages: {
              orderBy: { number: 'asc' },
              include: {
                items: {
                  orderBy: { number: 'asc' },
                  include: {
                    itemProgress: {
                      orderBy: { date: 'desc' },
                      take: 1, // Solo el ultimo avance de cada item
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundError('Version de presupuesto', budgetVersionId);
    }

    let totalBudget = new Prisma.Decimal(0);
    let executedBudget = new Prisma.Decimal(0);

    const categories: CategoryProgressSummary[] = version.categories.map((category) => {
      let categoryTotalBudget = new Prisma.Decimal(0);
      let categoryExecutedBudget = new Prisma.Decimal(0);

      const stages: StageProgressSummary[] = category.stages.map((stage) => {
        let stageTotalBudget = new Prisma.Decimal(0);
        let stageExecutedBudget = new Prisma.Decimal(0);

        const items: ItemProgressDetail[] = stage.items.map((item) => {
          const latestProgress = item.itemProgress[0];
          const advance = latestProgress ? Number(latestProgress.advance) : 0;
          const itemTotal = Number(item.totalPrice);
          const executedAmount = itemTotal * advance;

          stageTotalBudget = stageTotalBudget.add(item.totalPrice);
          stageExecutedBudget = stageExecutedBudget.add(
            new Prisma.Decimal(executedAmount)
          );

          return {
            budgetItemId: item.id,
            number: item.number,
            description: item.description,
            unit: item.unit,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
            advance,
            executedAmount: Math.round(executedAmount * 100) / 100,
            lastDate: latestProgress ? latestProgress.date.toISOString().split('T')[0] : null,
          };
        });

        const stageTotalNum = Number(stageTotalBudget);
        const stageExecutedNum = Number(stageExecutedBudget);
        const stageAdvance =
          stageTotalNum > 0 ? Math.round((stageExecutedNum / stageTotalNum) * 1000000) / 1000000 : 0;

        categoryTotalBudget = categoryTotalBudget.add(stageTotalBudget);
        categoryExecutedBudget = categoryExecutedBudget.add(stageExecutedBudget);

        return {
          stageId: stage.id,
          stageNumber: stage.number,
          description: stage.description,
          advance: stageAdvance,
          totalBudget: stageTotalNum,
          executedBudget: Math.round(stageExecutedNum * 100) / 100,
          items,
        };
      });

      const categoryTotalNum = Number(categoryTotalBudget);
      const categoryExecutedNum = Number(categoryExecutedBudget);
      const categoryAdvance =
        categoryTotalNum > 0 ? Math.round((categoryExecutedNum / categoryTotalNum) * 1000000) / 1000000 : 0;

      totalBudget = totalBudget.add(categoryTotalBudget);
      executedBudget = executedBudget.add(categoryExecutedBudget);

      return {
        categoryId: category.id,
        categoryNumber: category.number,
        name: category.name,
        advance: categoryAdvance,
        totalBudget: categoryTotalNum,
        executedBudget: Math.round(categoryExecutedNum * 100) / 100,
        stages,
      };
    });

    const totalBudgetNum = Number(totalBudget);
    const executedBudgetNum = Number(executedBudget);
    const overallAdvance =
      totalBudgetNum > 0 ? Math.round((executedBudgetNum / totalBudgetNum) * 1000000) / 1000000 : 0;

    return {
      overallAdvance,
      totalBudget: totalBudgetNum,
      executedBudget: Math.round(executedBudgetNum * 100) / 100,
      categories,
    };
  }
}

export const progressService = new ProgressService();
