import { prisma } from '@construccion/database';
import { NotFoundError } from '../../shared/utils/errors';

// Helper: enriquecer tareas con totales de gastos
function mapTaskExpenses(tasks: any[]) {
  return tasks.map((task) => ({
    ...task,
    totalExpenses: task.expenses.reduce(
      (sum: number, exp: any) => sum + Number(exp.totalAmount),
      0
    ),
    expenseCount: task._count.expenses,
    expenses: undefined,
  }));
}

const taskInclude = {
  where: { deletedAt: null },
  orderBy: { plannedStartDate: 'asc' as const },
  include: {
    budgetItem: { select: { id: true, number: true, description: true, unit: true } },
    _count: { select: { expenses: true } },
    expenses: {
      where: { deletedAt: null },
      select: { totalAmount: true },
    },
  },
};

class StagesService {
  async findByProject(projectId: string, organizationId: string) {
    const stages = await prisma.stage.findMany({
      where: {
        projectId,
        parentStageId: null,
        deletedAt: null,
        project: { organizationId },
      },
      orderBy: { order: 'asc' },
      include: {
        childStages: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            tasks: taskInclude,
            _count: { select: { tasks: true } },
          },
        },
        tasks: taskInclude,
        _count: { select: { tasks: true, childStages: true } },
      },
    });

    return stages.map((stage) => ({
      ...stage,
      tasks: mapTaskExpenses(stage.tasks),
      childStages: stage.childStages.map((child) => ({
        ...child,
        tasks: mapTaskExpenses(child.tasks),
      })),
    }));
  }

  async findById(id: string, organizationId: string) {
    const stage = await prisma.stage.findFirst({
      where: {
        id,
        deletedAt: null,
        project: { organizationId },
      },
      include: {
        tasks: {
          where: { deletedAt: null },
          orderBy: { plannedStartDate: 'asc' },
        },
      },
    });
    if (!stage) throw new NotFoundError('Etapa', id);
    return stage;
  }

  async create(projectId: string, data: any, organizationId: string) {
    // Verificar que el proyecto pertenece a la organización
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) throw new NotFoundError('Proyecto', projectId);

    return prisma.stage.create({
      data: {
        ...data,
        projectId,
      },
    });
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await prisma.stage.findFirst({
      where: {
        id,
        deletedAt: null,
        project: { organizationId },
      },
    });
    if (!existing) throw new NotFoundError('Etapa', id);

    return prisma.stage.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const existing = await prisma.stage.findFirst({
      where: {
        id,
        deletedAt: null,
        project: { organizationId },
      },
      include: {
        childStages: { where: { deletedAt: null }, select: { id: true } },
      },
    });
    if (!existing) throw new NotFoundError('Etapa', id);

    const now = new Date();

    // Soft-delete tasks de hijos y luego los hijos mismos
    if (existing.childStages.length > 0) {
      const childIds = existing.childStages.map((c) => c.id);
      await prisma.task.updateMany({
        where: { stageId: { in: childIds }, deletedAt: null },
        data: { deletedAt: now },
      });
      await prisma.stage.updateMany({
        where: { id: { in: childIds } },
        data: { deletedAt: now },
      });
    }

    // Soft-delete tasks directas y el stage mismo
    await prisma.task.updateMany({
      where: { stageId: id, deletedAt: null },
      data: { deletedAt: now },
    });
    await prisma.stage.update({
      where: { id },
      data: { deletedAt: now },
    });
  }
}

export const stagesService = new StagesService();
