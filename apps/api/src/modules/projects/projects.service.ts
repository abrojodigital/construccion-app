import { prisma, Prisma } from '@construccion/database';
import { NotFoundError, ValidationError } from '../../shared/utils/errors';
import { generateCode } from '../../shared/utils/code-generator';
import type { ProjectStatus, GanttData, ProjectFilters } from '@construccion/shared';

interface CreateProjectInput {
  name: string;
  description?: string;
  address: string;
  city: string;
  province?: string;
  status?: ProjectStatus;
  startDate?: Date;
  estimatedEndDate?: Date;
  estimatedBudget: number;
  managerId: string;
}

interface UpdateProjectInput extends Partial<CreateProjectInput> {
  actualEndDate?: Date;
  progress?: number;
}

export class ProjectsService {
  /**
   * Get all projects with pagination and filters
   */
  async findAll(organizationId: string, filters: ProjectFilters) {
    const {
      page = 1,
      limit = 20,
      status,
      managerId,
      search,
      startDateFrom,
      startDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.ProjectWhereInput = {
      organizationId,
      deletedAt: null,
      ...(status && { status }),
      ...(managerId && { managerId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(startDateFrom && {
        startDate: { gte: new Date(startDateFrom) },
      }),
      ...(startDateTo && {
        startDate: { lte: new Date(startDateTo) },
      }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          manager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: {
              stages: true,
              expenses: true,
              employeeAssignments: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      pagination: { page, limit, total },
    };
  }

  /**
   * Get a single project by ID
   */
  async findById(id: string, organizationId: string) {
    const project = await prisma.project.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        stages: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              where: { deletedAt: null },
              orderBy: { plannedStartDate: 'asc' },
            },
          },
        },
        budgets: {
          where: { deletedAt: null, isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            expenses: true,
            purchaseOrders: true,
            employeeAssignments: true,
            documents: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Proyecto', id);
    }

    return project;
  }

  /**
   * Create a new project
   */
  async create(data: CreateProjectInput, organizationId: string) {
    // Validar que el manager pertenezca a la misma organización
    const manager = await prisma.user.findFirst({
      where: { id: data.managerId, organizationId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!manager) {
      throw new ValidationError('El responsable seleccionado no pertenece a la organización');
    }

    const code = await generateCode('project', organizationId);

    const project = await prisma.project.create({
      data: {
        code,
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        province: data.province || 'Buenos Aires',
        status: data.status || 'PLANNING',
        startDate: data.startDate,
        estimatedEndDate: data.estimatedEndDate,
        estimatedBudget: data.estimatedBudget,
        managerId: data.managerId,
        organizationId,
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return project;
  }

  /**
   * Update a project
   */
  async update(id: string, data: UpdateProjectInput, organizationId: string) {
    // Verify project exists
    await this.findById(id, organizationId);

    // Validar que el nuevo manager pertenezca a la misma organización
    if (data.managerId) {
      const manager = await prisma.user.findFirst({
        where: { id: data.managerId, organizationId, deletedAt: null, isActive: true },
        select: { id: true },
      });
      if (!manager) {
        throw new ValidationError('El responsable seleccionado no pertenece a la organización');
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        province: data.province,
        status: data.status,
        startDate: data.startDate,
        estimatedEndDate: data.estimatedEndDate,
        actualEndDate: data.actualEndDate,
        estimatedBudget: data.estimatedBudget,
        managerId: data.managerId,
        progress: data.progress,
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return project;
  }

  /**
   * Soft delete a project
   */
  async delete(id: string, organizationId: string) {
    await this.findById(id, organizationId);

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get project summary with KPIs
   */
  async getSummary(id: string, organizationId: string) {
    const project = await this.findById(id, organizationId);

    // Get expense totals by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        projectId: id,
        deletedAt: null,
        status: { in: ['APPROVED', 'PAID'] },
      },
      _sum: { totalAmount: true },
    });

    // Get task statistics
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: {
        stage: { projectId: id },
        deletedAt: null,
      },
      _count: true,
    });

    // Get employee count
    const employeeCount = await prisma.employeeProjectAssignment.count({
      where: { projectId: id, isActive: true },
    });

    return {
      project: {
        id: project.id,
        code: project.code,
        name: project.name,
        status: project.status,
        progress: project.progress,
      },
      budget: {
        estimated: project.estimatedBudget,
        spent: project.currentSpent,
        remaining: Number(project.estimatedBudget) - Number(project.currentSpent),
        percentage: Number(project.estimatedBudget) > 0
          ? Math.round((Number(project.currentSpent) / Number(project.estimatedBudget)) * 100)
          : 0,
      },
      expensesByCategory,
      taskStats,
      employeeCount,
    };
  }

  /**
   * Get Gantt chart data for a project
   */
  async getGanttData(id: string, organizationId: string): Promise<GanttData> {
    const project = await this.findById(id, organizationId);

    const tasks = await prisma.task.findMany({
      where: {
        stage: { projectId: id },
        deletedAt: null,
      },
      include: {
        stage: { select: { id: true, name: true } },
        dependencies: {
          include: {
            dependsOn: { select: { id: true, name: true } },
          },
        },
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [
        { stage: { order: 'asc' } },
        { plannedStartDate: 'asc' },
      ],
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        startDate: project.startDate?.toISOString() || null,
        estimatedEndDate: project.estimatedEndDate?.toISOString() || null,
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        name: task.name,
        start: task.plannedStartDate?.toISOString() || null,
        end: task.plannedEndDate?.toISOString() || null,
        progress: task.progress,
        status: task.status as any,
        stageId: task.stageId,
        stageName: task.stage.name,
        dependencies: task.dependencies.map((d) => ({
          id: d.dependsOnId,
          type: d.dependencyType as any,
          lag: d.lagDays,
        })),
        assignees: task.assignments
          .map((a) => a.user || a.employee)
          .filter(Boolean)
          .map((a) => ({
            id: a!.id,
            firstName: a!.firstName,
            lastName: a!.lastName,
          })),
      })),
    };
  }

  /**
   * Get budget status for a project
   */
  async getBudgetStatus(id: string, organizationId: string) {
    const project = await this.findById(id, organizationId);

    // Get active budget
    const budget = await prisma.budget.findFirst({
      where: { projectId: id, deletedAt: null, isActive: true },
    });

    // Get expenses by category
    const categories = await prisma.expenseCategory.findMany({
      where: { organizationId },
    });

    const expensesByCategory = await Promise.all(
      categories.map(async (category) => {
        const result = await prisma.expense.aggregate({
          where: {
            projectId: id,
            categoryId: category.id,
            deletedAt: null,
            status: { in: ['APPROVED', 'PAID'] },
          },
          _sum: { totalAmount: true },
        });

        return {
          categoryId: category.id,
          categoryName: category.name,
          categoryCode: category.code,
          spent: result._sum.totalAmount || 0,
        };
      })
    );

    // Calculate budget vs actual
    const totalBudget = budget
      ? Number(budget.materialsBudget) +
        Number(budget.laborBudget) +
        Number(budget.equipmentBudget) +
        Number(budget.subcontractBudget) +
        Number(budget.otherBudget) +
        Number(budget.contingencyBudget)
      : Number(project.estimatedBudget);

    const totalSpent = Number(project.currentSpent);

    return {
      projectId: id,
      budget: {
        total: totalBudget,
        materials: budget ? Number(budget.materialsBudget) : 0,
        labor: budget ? Number(budget.laborBudget) : 0,
        equipment: budget ? Number(budget.equipmentBudget) : 0,
        subcontract: budget ? Number(budget.subcontractBudget) : 0,
        other: budget ? Number(budget.otherBudget) : 0,
        contingency: budget ? Number(budget.contingencyBudget) : 0,
      },
      spent: {
        total: totalSpent,
        byCategory: expensesByCategory,
      },
      remaining: totalBudget - totalSpent,
      percentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    };
  }

  /**
   * Update project progress based on tasks
   */
  async recalculateProgress(projectId: string) {
    // Get all tasks for the project
    const tasks = await prisma.task.findMany({
      where: {
        stage: { projectId },
        deletedAt: null,
      },
      select: { progress: true },
    });

    if (tasks.length === 0) {
      return;
    }

    // Calculate average progress
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    const averageProgress = Math.round(totalProgress / tasks.length);

    // Update project
    await prisma.project.update({
      where: { id: projectId },
      data: { progress: averageProgress },
    });
  }

  /**
   * Update project spent amount
   */
  async recalculateSpent(projectId: string) {
    const result = await prisma.expense.aggregate({
      where: {
        projectId,
        deletedAt: null,
        status: { in: ['APPROVED', 'PAID'] },
      },
      _sum: { totalAmount: true },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { currentSpent: result._sum.totalAmount || 0 },
    });
  }
}

export const projectsService = new ProjectsService();
