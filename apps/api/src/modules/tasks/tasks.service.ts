import { prisma } from '@construccion/database';
import { NotFoundError } from '../../shared/utils/errors';
import { projectsService } from '../projects/projects.service';

class TasksService {
  async findByStage(stageId: string, organizationId: string) {
    return prisma.task.findMany({
      where: {
        stageId,
        deletedAt: null,
        stage: { project: { organizationId } },
      },
      orderBy: { plannedStartDate: 'asc' },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { subtasks: true, dependencies: true } },
      },
    });
  }

  async findById(id: string, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
        stage: { project: { organizationId } },
      },
      include: {
        stage: {
          select: {
            id: true,
            name: true,
            projectId: true,
            project: { select: { id: true, code: true, name: true } },
          },
        },
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        dependencies: {
          include: { dependsOn: { select: { id: true, name: true } } },
        },
        subtasks: { where: { deletedAt: null } },
        comments: {
          where: { deletedAt: null },
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!task) throw new NotFoundError('Tarea', id);
    return task;
  }

  async create(stageId: string, data: any, organizationId: string) {
    const stage = await prisma.stage.findFirst({
      where: {
        id: stageId,
        deletedAt: null,
        project: { organizationId },
      },
      include: { project: { select: { id: true } } },
    });
    if (!stage) throw new NotFoundError('Etapa', stageId);

    const task = await prisma.task.create({
      data: {
        ...data,
        stageId,
      },
      include: {
        stage: { select: { id: true, name: true, projectId: true } },
      },
    });

    // Recalculate project progress
    await projectsService.recalculateProgress(stage.project.id);

    return task;
  }

  async update(id: string, data: any, organizationId: string) {
    const existing = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
        stage: { project: { organizationId } },
      },
      include: { stage: { select: { projectId: true } } },
    });
    if (!existing) throw new NotFoundError('Tarea', id);

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    // Recalculate project progress
    await projectsService.recalculateProgress(existing.stage.projectId);

    return task;
  }

  async updateStatus(id: string, status: string, organizationId: string) {
    const existing = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
        stage: { project: { organizationId } },
      },
      include: { stage: { select: { projectId: true } } },
    });
    if (!existing) throw new NotFoundError('Tarea', id);

    const updateData: any = { status };
    if (status === 'IN_PROGRESS' && !existing.actualStartDate) {
      updateData.actualStartDate = new Date();
    }
    if (status === 'COMPLETED') {
      updateData.actualEndDate = new Date();
      updateData.progress = 100;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    await projectsService.recalculateProgress(existing.stage.projectId);

    return task;
  }

  async createDependency(id: string, data: any, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
        stage: { project: { organizationId } },
      },
    });
    if (!task) throw new NotFoundError('Tarea', id);

    return prisma.taskDependency.create({
      data: {
        taskId: id,
        dependsOnId: data.dependsOnId,
        dependencyType: data.dependencyType,
        lagDays: data.lagDays || 0,
      },
      include: { dependsOn: { select: { id: true, name: true } } },
    });
  }

  async deleteDependency(dependencyId: string) {
    await prisma.taskDependency.delete({
      where: { id: dependencyId },
    });
  }

  async assign(id: string, userId: string | undefined, employeeId: string | undefined, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
        stage: { project: { organizationId } },
      },
    });
    if (!task) throw new NotFoundError('Tarea', id);

    return prisma.taskAssignment.create({
      data: {
        taskId: id,
        userId: userId || null,
        employeeId: employeeId || null,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const existing = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null,
        stage: { project: { organizationId } },
      },
      include: { stage: { select: { projectId: true } } },
    });
    if (!existing) throw new NotFoundError('Tarea', id);

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await projectsService.recalculateProgress(existing.stage.projectId);
  }
}

export const tasksService = new TasksService();
