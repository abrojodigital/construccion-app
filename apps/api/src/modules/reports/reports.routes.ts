import { Router } from 'express';
import { prisma } from '@construccion/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { sendSuccess } from '../../shared/utils/response';
import { escapeHtml } from '../../shared/utils/html-escape';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/reports/dashboard
router.get('/dashboard', requirePermission('reports', 'read'), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { period = 'month', projectId } = req.query as { period?: string; projectId?: string };

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | undefined;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = undefined;
    }

    // Base where clause for expenses
    const expenseWhere: any = {
      project: { organizationId },
      deletedAt: null,
      status: { in: ['APPROVED', 'PAID'] },
    };
    if (startDate) {
      expenseWhere.expenseDate = { gte: startDate };
    }
    if (projectId) {
      expenseWhere.projectId = projectId;
    }

    // Get project counts by status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      where: { organizationId, deletedAt: null },
      _count: true,
    });

    // Get total budget and spent
    const projectWhere: any = { organizationId, deletedAt: null };
    if (projectId) {
      projectWhere.id = projectId;
    }
    const budgetAggregation = await prisma.project.aggregate({
      where: projectWhere,
      _sum: { estimatedBudget: true, currentSpent: true },
    });

    // Get employees count
    const totalEmployees = await prisma.employee.count({
      where: { organizationId, deletedAt: null },
    });
    const activeEmployees = await prisma.employee.count({
      where: { organizationId, deletedAt: null, isActive: true },
    });

    // Get pending expenses count
    const pendingExpenses = await prisma.expense.count({
      where: {
        project: { organizationId },
        deletedAt: null,
        status: 'PENDING_APPROVAL',
      },
    });

    // Get total expenses count
    const totalExpenses = await prisma.expense.count({
      where: expenseWhere,
    });

    // Get expenses by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: expenseWhere,
      _sum: { totalAmount: true },
    });

    // Get category names
    const categories = await prisma.expenseCategory.findMany({
      where: { organizationId },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Calculate totals for percentages
    const totalExpenseAmount = expensesByCategory.reduce(
      (sum, e) => sum + Number(e._sum.totalAmount || 0),
      0
    );

    const expensesByCategoryFormatted = expensesByCategory.map((e) => ({
      category: categoryMap.get(e.categoryId) || 'Sin categoría',
      amount: Number(e._sum.totalAmount || 0),
      percentage: totalExpenseAmount > 0
        ? (Number(e._sum.totalAmount || 0) / totalExpenseAmount) * 100
        : 0,
    }));

    // Get active projects for progress (PLANNING + IN_PROGRESS)
    const activeProjectsData = await prisma.project.findMany({
      where: { organizationId, deletedAt: null, status: { in: ['PLANNING', 'IN_PROGRESS'] } },
      select: {
        id: true,
        code: true,
        name: true,
        progress: true,
        estimatedBudget: true,
        currentSpent: true,
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    const projectProgress = activeProjectsData.map((p) => ({
      project: p.name,
      code: p.code,
      progress: p.progress,
      budget: Number(p.estimatedBudget),
      spent: Number(p.currentSpent),
    }));

    // Get monthly expenses for chart — siempre últimos 12 meses (independiente del filtro de período)
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthlyExpenseWhere: any = {
      project: { organizationId },
      deletedAt: null,
      status: { in: ['APPROVED', 'PAID'] },
      expenseDate: { gte: twelveMonthsAgo },
    };
    if (projectId) {
      monthlyExpenseWhere.projectId = projectId;
    }

    const recentExpenses = await prisma.expense.findMany({
      where: monthlyExpenseWhere,
      select: { expenseDate: true, totalAmount: true },
      orderBy: { expenseDate: 'asc' },
    });

    // Construir mapa con los últimos 12 meses (incluyendo meses sin gastos como 0)
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyMap = new Map<string, number>();

    // Inicializar todos los meses del rango con 0
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, 0);
    }

    recentExpenses.forEach((expense) => {
      if (expense.expenseDate) {
        const key = `${expense.expenseDate.getFullYear()}-${String(expense.expenseDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyMap.has(key)) {
          monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(expense.totalAmount));
        }
      }
    });

    const monthlyExpenses = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, amount]) => {
        const [year, month] = key.split('-');
        const label = now.getFullYear() !== parseInt(year)
          ? `${monthNames[parseInt(month, 10) - 1]} ${year.slice(2)}`
          : monthNames[parseInt(month, 10) - 1];
        return { month: label, amount };
      });

    // Calculate KPIs
    const totalProjects = projectsByStatus.reduce((sum, p) => sum + p._count, 0);
    // "Activos" = cualquier proyecto no completado ni cancelado
    const activeProjectsCount = projectsByStatus
      .filter((p) => !['COMPLETED', 'CANCELLED'].includes(p.status))
      .reduce((sum, p) => sum + p._count, 0);
    const completedProjectsCount = projectsByStatus.find((p) => p.status === 'COMPLETED')?._count || 0;

    const totalBudget = Number(budgetAggregation._sum.estimatedBudget || 0);
    const totalSpent = Number(budgetAggregation._sum.currentSpent || 0);
    const budgetUtilization = totalBudget > 0
      ? (totalSpent / totalBudget) * 100
      : 0;

    // Get overdue tasks count
    const overdueTasksCount = await prisma.task.count({
      where: {
        stage: {
          project: { organizationId },
        },
        deletedAt: null,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
        plannedEndDate: { lt: now },
      },
    });

    // Get low stock materials count
    const lowStockMaterialsCount = await prisma.material.count({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
        currentStock: { lte: prisma.material.fields.minimumStock },
      },
    }).catch(() => {
      // Fallback: count materials where currentStock < minimumStock manually
      return 0;
    });

    // Get low stock materials with manual comparison
    const allMaterials = await prisma.material.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
      },
      select: { currentStock: true, minimumStock: true },
    });
    const lowStockCount = allMaterials.filter(m => Number(m.currentStock) <= Number(m.minimumStock)).length;

    // Get all projects for projectCards (todos excepto CANCELLED)
    const projectsForCards = await prisma.project.findMany({
      where: { organizationId, deletedAt: null, status: { notIn: ['CANCELLED'] } },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        progress: true,
        estimatedBudget: true,
        currentSpent: true,
        estimatedEndDate: true,
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    const projectCards = projectsForCards.map((p) => {
      const budget = Number(p.estimatedBudget);
      const spent = Number(p.currentSpent);
      const budgetPercentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;

      let daysRemaining: number | null = null;
      if (p.estimatedEndDate) {
        const diffTime = p.estimatedEndDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        progress: p.progress,
        budgetPercentage,
        daysRemaining,
      };
    });

    const budgetVariance = totalBudget > 0
      ? ((totalBudget - totalSpent) / totalBudget) * 100
      : 0;

    sendSuccess(res, {
      kpis: {
        totalProjects,
        activeProjects: activeProjectsCount,
        completedProjects: completedProjectsCount,
        totalBudget,
        totalSpent,
        budgetUtilization,
        overdueTasksCount,
        pendingApprovalsCount: pendingExpenses,
        lowStockMaterialsCount: lowStockCount,
      },
      projectCards,
      // Extra data for other report views
      totalExpenses,
      totalEmployees,
      activeEmployees,
      budgetVariance,
      expensesByCategory: expensesByCategoryFormatted,
      projectProgress,
      monthlyExpenses,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/projects/:id/costs
router.get('/projects/:id/costs', requirePermission('reports', 'read'), async (req, res, next) => {
  try {
    const projectId = req.params.id;

    // Get project details
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: req.user!.organizationId },
      include: {
        budgets: { where: { deletedAt: null, isActive: true }, take: 1 },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Get expenses by category
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        projectId,
        deletedAt: null,
        status: { in: ['APPROVED', 'PAID'] },
      },
      _sum: { totalAmount: true },
    });

    // Get category names
    const categories = await prisma.expenseCategory.findMany({
      where: { organizationId: req.user!.organizationId },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    // Get monthly expenses
    const monthlyExpenses = await prisma.$queryRaw<
      { month: string; total: number }[]
    >`
      SELECT
        TO_CHAR(expense_date, 'YYYY-MM') as month,
        SUM(total_amount) as total
      FROM expenses
      WHERE project_id = ${projectId}
        AND deleted_at IS NULL
        AND status IN ('APPROVED', 'PAID')
      GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
      ORDER BY month
    `;

    const budget = project.budgets[0];
    const totalBudget = budget
      ? Number(budget.materialsBudget) +
        Number(budget.laborBudget) +
        Number(budget.equipmentBudget) +
        Number(budget.subcontractBudget) +
        Number(budget.otherBudget) +
        Number(budget.contingencyBudget)
      : Number(project.estimatedBudget);

    const totalActual = Number(project.currentSpent);

    sendSuccess(res, {
      projectId,
      projectName: project.name,
      budgetedCost: totalBudget,
      actualCost: totalActual,
      variance: totalBudget - totalActual,
      variancePercentage: totalBudget > 0 ? Math.round(((totalBudget - totalActual) / totalBudget) * 100) : 0,
      costByCategory: expensesByCategory.map((e) => ({
        categoryId: e.categoryId,
        categoryName: categoryMap.get(e.categoryId)?.name || 'Desconocido',
        actual: Number(e._sum.totalAmount || 0),
      })),
      monthlyBreakdown: monthlyExpenses.map((m) => ({
        month: m.month,
        actual: Number(m.total),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/projects/:id/progress
router.get('/projects/:id/progress', requirePermission('reports', 'read'), async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: req.user!.organizationId },
      include: {
        stages: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: {
                tasks: { where: { deletedAt: null } },
              },
            },
            tasks: {
              where: { deletedAt: null },
              select: { status: true, progress: true },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    const now = new Date();

    const stages = project.stages.map((stage) => {
      const completedTasks = stage.tasks.filter((t) => t.status === 'COMPLETED').length;
      const totalTasks = stage.tasks.length;

      let status: 'on_track' | 'delayed' | 'ahead' | 'completed' = 'on_track';
      if (stage.progress === 100) {
        status = 'completed';
      } else if (stage.plannedEndDate && stage.plannedEndDate < now && stage.progress < 100) {
        status = 'delayed';
      } else if (stage.plannedStartDate && stage.actualStartDate && stage.actualStartDate < stage.plannedStartDate) {
        status = 'ahead';
      }

      return {
        id: stage.id,
        name: stage.name,
        progress: stage.progress,
        plannedStart: stage.plannedStartDate?.toISOString() || null,
        plannedEnd: stage.plannedEndDate?.toISOString() || null,
        actualStart: stage.actualStartDate?.toISOString() || null,
        actualEnd: stage.actualEndDate?.toISOString() || null,
        status,
        completedTasks,
        totalTasks,
      };
    });

    sendSuccess(res, {
      projectId,
      projectName: project.name,
      overallProgress: project.progress,
      stages,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/expenses
router.get('/expenses', requirePermission('reports', 'read'), async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'category' } = req.query as {
      startDate?: string;
      endDate?: string;
      groupBy?: 'category' | 'project' | 'supplier';
    };

    const whereClause: any = {
      project: { organizationId: req.user!.organizationId },
      deletedAt: null,
      status: { in: ['APPROVED', 'PAID'] },
    };

    if (startDate && endDate) {
      whereClause.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    let groupByField: 'categoryId' | 'projectId' | 'supplierId';
    switch (groupBy) {
      case 'project':
        groupByField = 'projectId';
        break;
      case 'supplier':
        groupByField = 'supplierId';
        break;
      default:
        groupByField = 'categoryId';
    }

    const expenses = await prisma.expense.groupBy({
      by: [groupByField],
      where: whereClause,
      _sum: { totalAmount: true },
      _count: true,
    });

    // Get names for the grouped field
    let nameMap = new Map<string, string>();

    if (groupBy === 'category') {
      const categories = await prisma.expenseCategory.findMany();
      nameMap = new Map(categories.map((c) => [c.id, c.name]));
    } else if (groupBy === 'project') {
      const projects = await prisma.project.findMany({
        where: { organizationId: req.user!.organizationId },
        select: { id: true, name: true },
      });
      nameMap = new Map(projects.map((p) => [p.id, p.name]));
    } else if (groupBy === 'supplier') {
      const suppliers = await prisma.supplier.findMany({
        where: { organizationId: req.user!.organizationId },
        select: { id: true, name: true },
      });
      nameMap = new Map(suppliers.map((s) => [s.id, s.name]));
    }

    const result = expenses.map((e: any) => ({
      id: e[groupByField],
      name: nameMap.get(e[groupByField]) || 'Sin asignar',
      total: Number(e._sum.totalAmount || 0),
      count: e._count,
    }));

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reports/projects/:id/budget-control
router.get('/projects/:id/budget-control', requirePermission('reports', 'read'), async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const organizationId = req.user!.organizationId;

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId, deletedAt: null },
      select: { id: true, code: true, name: true, estimatedBudget: true, currentSpent: true },
    });
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Versión de presupuesto aprobada
    const budgetVersion = await prisma.budgetVersion.findFirst({
      where: { projectId, organizationId, status: 'APPROVED', deletedAt: null },
      orderBy: { version: 'desc' },
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

    const allItemIds = budgetVersion
      ? budgetVersion.categories.flatMap((c) => c.stages.flatMap((s) => s.items.map((i) => i.id)))
      : [];

    // Certificado acumulado por ítem (APPROVED + PAID)
    const certifiedByItem = allItemIds.length > 0
      ? await prisma.certificateItem.groupBy({
          by: ['budgetItemId'],
          where: {
            budgetItemId: { in: allItemIds },
            certificate: { projectId, status: { in: ['APPROVED', 'PAID'] } },
          },
          _sum: { currentAmount: true },
        })
      : [];
    const certifiedMap = new Map(
      certifiedByItem.map((c) => [c.budgetItemId, Number(c._sum.currentAmount || 0)])
    );

    // Avance físico más reciente por ítem
    const allProgress = allItemIds.length > 0
      ? await prisma.itemProgress.findMany({
          where: { budgetItemId: { in: allItemIds } },
          orderBy: { date: 'desc' },
          select: { budgetItemId: true, advance: true },
        })
      : [];
    const progressMap = new Map<string, number>();
    for (const p of allProgress) {
      if (!progressMap.has(p.budgetItemId)) {
        progressMap.set(p.budgetItemId, Number(p.advance));
      }
    }

    // Certificados del proyecto
    const certificates = await prisma.certificate.findMany({
      where: { projectId, organizationId, deletedAt: null },
      orderBy: { number: 'asc' },
      select: {
        id: true, code: true, number: true, status: true,
        periodStart: true, periodEnd: true,
        subtotal: true, totalAmount: true,
        acopioAmount: true, anticipoAmount: true, fondoReparoAmount: true, ivaAmount: true,
      },
    });

    const certTotals = certificates
      .filter((c) => ['APPROVED', 'PAID'].includes(c.status))
      .reduce((acc, c) => ({
        subtotal: acc.subtotal + Number(c.subtotal),
        totalAmount: acc.totalAmount + Number(c.totalAmount),
      }), { subtotal: 0, totalAmount: 0 });

    // Gastos reales APPROVED + PAID — por categoría
    const expensesRaw = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { projectId, deletedAt: null, status: { in: ['APPROVED', 'PAID'] } },
      _sum: { totalAmount: true },
      _count: true,
    });
    const expenseCategories = await prisma.expenseCategory.findMany({ where: { organizationId } });
    const categoryMap = new Map(expenseCategories.map((c) => [c.id, c.name]));
    const totalGastado = expensesRaw.reduce((s, e) => s + Number(e._sum.totalAmount || 0), 0);
    const gastosPorCategoria = expensesRaw.map((e) => ({
      categoria: categoryMap.get(e.categoryId) || 'Sin categoría',
      monto: Number(e._sum.totalAmount || 0),
      cantidad: e._count,
    }));

    // Gastos reales APPROVED + PAID — imputados por ítem de presupuesto via ExpenseItem
    const gastadoByItem = allItemIds.length > 0
      ? await prisma.expenseItem.groupBy({
          by: ['budgetItemId'],
          where: {
            budgetItemId: { in: allItemIds, not: null },
            expense: {
              projectId,
              deletedAt: null,
              status: { in: ['APPROVED', 'PAID'] },
            },
          },
          _sum: { amount: true },
        })
      : [];
    const gastadoMap = new Map(
      gastadoByItem
        .filter((e) => e.budgetItemId !== null)
        .map((e) => [e.budgetItemId as string, Number(e._sum.amount || 0)])
    );

    // Armar jerarquía con datos de certificación y avance
    const categoriesResult = budgetVersion?.categories.map((cat) => {
      const stages = cat.stages.map((stage) => {
        const items = stage.items.map((item) => {
          const certificado = certifiedMap.get(item.id) || 0;
          const gastado = gastadoMap.get(item.id) || 0;
          const avanceFisico = progressMap.get(item.id) || 0;
          const totalPrice = Number(item.totalPrice);
          return {
            id: item.id,
            number: item.number,
            description: item.description,
            unit: item.unit,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            totalPrice,
            certificado,
            gastado,
            avanceFisico,
            porcentajeCertificado: totalPrice > 0 ? certificado / totalPrice : 0,
            porcentajeGastado: totalPrice > 0 ? gastado / totalPrice : 0,
          };
        });
        const stageCertificado = items.reduce((s, i) => s + i.certificado, 0);
        const stageGastado = items.reduce((s, i) => s + i.gastado, 0);
        const stageTotalPrice = Number(stage.totalPrice);
        const stageAvanceFisico = stageTotalPrice > 0
          ? items.reduce((s, i) => s + i.avanceFisico * i.totalPrice, 0) / stageTotalPrice
          : 0;
        return {
          id: stage.id,
          number: stage.number,
          description: stage.description,
          unit: stage.unit,
          quantity: Number(stage.quantity),
          unitPrice: Number(stage.unitPrice),
          totalPrice: stageTotalPrice,
          incidencePct: Number(stage.incidencePct),
          certificado: stageCertificado,
          gastado: stageGastado,
          avanceFisico: stageAvanceFisico,
          items,
        };
      });
      const catCertificado = stages.reduce((s, st) => s + st.certificado, 0);
      const catGastado = stages.reduce((s, st) => s + st.gastado, 0);
      const catSubtotal = Number(cat.subtotalCostoCosto);
      const catAvanceFisico = catSubtotal > 0
        ? stages.reduce((s, st) => s + st.avanceFisico * st.totalPrice, 0) / catSubtotal
        : 0;
      return {
        id: cat.id,
        number: cat.number,
        name: cat.name,
        subtotalCostoCosto: catSubtotal,
        certificado: catCertificado,
        gastado: catGastado,
        avanceFisico: catAvanceFisico,
        stages,
      };
    }) || [];

    const presupuesto = budgetVersion ? Number(budgetVersion.totalPrecio) : Number(project.estimatedBudget);
    const presupuestoCostoCosto = budgetVersion ? Number(budgetVersion.totalCostoCosto) : null;

    sendSuccess(res, {
      project: { id: project.id, code: project.code, name: project.name },
      budgetVersion: budgetVersion
        ? {
            id: budgetVersion.id,
            code: budgetVersion.code,
            name: budgetVersion.name,
            version: budgetVersion.version,
            status: budgetVersion.status,
            coeficienteK: Number(budgetVersion.coeficienteK),
            totalCostoCosto: Number(budgetVersion.totalCostoCosto),
            totalPrecio: Number(budgetVersion.totalPrecio),
          }
        : null,
      summary: {
        presupuesto,
        presupuestoCostoCosto,
        gastado: totalGastado,
        certificadoSubtotal: certTotals.subtotal,
        certificadoTotal: certTotals.totalAmount,
        variacionGasto: presupuesto - totalGastado,
        porcentajeGastado: presupuesto > 0 ? totalGastado / presupuesto : 0,
        porcentajeCertificado: presupuesto > 0 ? certTotals.subtotal / presupuesto : 0,
      },
      categories: categoriesResult,
      gastosPorCategoria,
      certificados: certificates.map((c) => ({
        id: c.id,
        code: c.code,
        number: c.number,
        status: c.status,
        periodStart: c.periodStart,
        periodEnd: c.periodEnd,
        subtotal: Number(c.subtotal),
        acopioAmount: Number(c.acopioAmount),
        anticipoAmount: Number(c.anticipoAmount),
        fondoReparoAmount: Number(c.fondoReparoAmount),
        ivaAmount: Number(c.ivaAmount),
        totalAmount: Number(c.totalAmount),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/reports/export/pdf
router.post('/export/pdf', requirePermission('reports', 'read'), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { period = 'month', projectId } = req.body as { period?: string; projectId?: string };

    // Get organization info
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    // Get projects data
    const projectWhere: any = { organizationId, deletedAt: null };
    if (projectId) {
      projectWhere.id = projectId;
    }

    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        code: true,
        name: true,
        status: true,
        progress: true,
        estimatedBudget: true,
        currentSpent: true,
        startDate: true,
        estimatedEndDate: true,
      },
      orderBy: { code: 'asc' },
    });

    // Get expenses summary
    const expensesByCategory = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        project: { organizationId },
        deletedAt: null,
        status: { in: ['APPROVED', 'PAID'] },
        ...(projectId && { projectId }),
      },
      _sum: { totalAmount: true },
    });

    const categories = await prisma.expenseCategory.findMany({
      where: { organizationId },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Generate simple HTML report
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reporte - ${escapeHtml(organization?.name || 'Sistema de Construcción')}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #3b82f6; color: white; }
    tr:nth-child(even) { background-color: #f9fafb; }
    .header { display: flex; justify-content: space-between; align-items: center; }
    .date { color: #6b7280; font-size: 14px; }
    .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-item { display: inline-block; margin-right: 40px; }
    .summary-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .summary-label { font-size: 12px; color: #6b7280; }
    .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .status-progress { background: #dbeafe; color: #1d4ed8; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-planning { background: #fef3c7; color: #92400e; }
    .currency { text-align: right; }
    .progress { text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(organization?.name || 'Sistema de Construcción')}</h1>
    <span class="date">Generado: ${new Date().toLocaleDateString('es-AR')}</span>
  </div>

  <h2>Resumen de Proyectos</h2>
  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Proyecto</th>
        <th>Estado</th>
        <th>Progreso</th>
        <th class="currency">Presupuesto</th>
        <th class="currency">Gastado</th>
        <th class="currency">Variación</th>
      </tr>
    </thead>
    <tbody>
      ${projects.map(p => {
        const budget = Number(p.estimatedBudget);
        const spent = Number(p.currentSpent);
        const variance = budget - spent;
        const statusClass = p.status === 'IN_PROGRESS' ? 'status-progress' :
                           p.status === 'COMPLETED' ? 'status-completed' : 'status-planning';
        const statusLabel = p.status === 'IN_PROGRESS' ? 'En Progreso' :
                           p.status === 'COMPLETED' ? 'Completado' :
                           p.status === 'PLANNING' ? 'Planificación' : p.status;
        return `
          <tr>
            <td>${escapeHtml(p.code)}</td>
            <td>${escapeHtml(p.name)}</td>
            <td><span class="status ${statusClass}">${escapeHtml(statusLabel)}</span></td>
            <td class="progress">${p.progress}%</td>
            <td class="currency">$${budget.toLocaleString('es-AR')}</td>
            <td class="currency">$${spent.toLocaleString('es-AR')}</td>
            <td class="currency" style="color: ${variance >= 0 ? '#166534' : '#dc2626'}">
              ${variance >= 0 ? '+' : ''}$${variance.toLocaleString('es-AR')}
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <h2>Gastos por Categoría</h2>
  <table>
    <thead>
      <tr>
        <th>Categoría</th>
        <th class="currency">Total</th>
      </tr>
    </thead>
    <tbody>
      ${expensesByCategory.map(e => `
        <tr>
          <td>${escapeHtml(categoryMap.get(e.categoryId) || 'Sin categoría')}</td>
          <td class="currency">$${Number(e._sum.totalAmount || 0).toLocaleString('es-AR')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px;">
    Sistema de Gestión de Construcción - Reporte generado automáticamente
  </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${new Date().toISOString().split('T')[0]}.html`);
    res.send(html);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/reports/export/excel
router.post('/export/excel', requirePermission('reports', 'read'), async (req, res, next) => {
  try {
    const organizationId = req.user!.organizationId;
    const { period = 'month', projectId } = req.body as { period?: string; projectId?: string };

    // Get projects data
    const projectWhere: any = { organizationId, deletedAt: null };
    if (projectId) {
      projectWhere.id = projectId;
    }

    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        code: true,
        name: true,
        status: true,
        progress: true,
        estimatedBudget: true,
        currentSpent: true,
        startDate: true,
        estimatedEndDate: true,
      },
      orderBy: { code: 'asc' },
    });

    // Get expenses
    const expenses = await prisma.expense.findMany({
      where: {
        project: { organizationId },
        deletedAt: null,
        ...(projectId && { projectId }),
      },
      include: {
        project: { select: { code: true, name: true } },
        category: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { expenseDate: 'desc' },
      take: 500,
    });

    // Generate CSV (Excel-compatible)
    const projectsCsv = [
      ['PROYECTOS'],
      ['Código', 'Nombre', 'Estado', 'Progreso %', 'Presupuesto', 'Gastado', 'Variación'],
      ...projects.map(p => [
        p.code,
        p.name,
        p.status,
        p.progress,
        Number(p.estimatedBudget),
        Number(p.currentSpent),
        Number(p.estimatedBudget) - Number(p.currentSpent),
      ]),
      [],
      ['GASTOS'],
      ['Referencia', 'Fecha', 'Proyecto', 'Categoría', 'Proveedor', 'Descripción', 'Monto', 'IVA', 'Total', 'Estado'],
      ...expenses.map(e => [
        e.reference,
        e.expenseDate?.toISOString().split('T')[0] || '',
        e.project?.code || '',
        e.category?.name || '',
        e.supplier?.name || '',
        e.description,
        Number(e.amount),
        Number(e.taxAmount),
        Number(e.totalAmount),
        e.status,
      ]),
    ];

    const csvContent = projectsCsv
      .map(row => row.map(cell => {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
      .join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(bom + csvContent);
  } catch (error) {
    next(error);
  }
});

export { router as reportsRoutes };
