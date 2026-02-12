import { Router } from 'express';
import { prisma, Prisma } from '@construccion/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId, validateQuery } from '../../middleware/validation.middleware';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';
import { createEmployeeSchema, updateEmployeeSchema, createAttendanceSchema, bulkAttendanceSchema, paginationSchema } from '@construccion/shared';
import { NotFoundError } from '../../shared/utils/errors';
import { generateSimpleCode } from '../../shared/utils/code-generator';

const router = Router();

router.use(authMiddleware);

// GET /api/v1/employees
router.get(
  '/',
  requirePermission('employees', 'read'),
  validateQuery(paginationSchema),
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, sortBy = 'lastName', sortOrder = 'asc' } = req.query as any;
      const search = req.query.search as string | undefined;
      const department = req.query.department as string | undefined;
      const specialty = req.query.specialty as string | undefined;
      const isActive = req.query.isActive as string | undefined;

      const where: Prisma.EmployeeWhereInput = {
        organizationId: req.user!.organizationId,
        deletedAt: null,
        ...(department && { department }),
        ...(specialty && { specialty }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { dni: { contains: search } },
            { legajo: { contains: search } },
          ],
        }),
      };

      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { [sortBy]: sortOrder },
          include: {
            _count: { select: { projectAssignments: true } },
          },
        }),
        prisma.employee.count({ where }),
      ]);

      sendPaginated(res, employees, { page: Number(page), limit: Number(limit), total });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/employees/:id
router.get('/:id', requirePermission('employees', 'read'), validateId, async (req, res, next) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId,
        deletedAt: null,
      },
      include: {
        projectAssignments: {
          where: { isActive: true },
          include: { project: { select: { id: true, code: true, name: true, status: true } } },
        },
      },
    });
    if (!employee) throw new NotFoundError('Empleado', req.params.id);
    sendSuccess(res, employee);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/employees
router.post(
  '/',
  requirePermission('employees', 'write'),
  validateBody(createEmployeeSchema),
  async (req, res, next) => {
    try {
      const legajo = await generateSimpleCode('employee', req.user!.organizationId);

      const employee = await prisma.employee.create({
        data: {
          ...req.body,
          legajo,
          organizationId: req.user!.organizationId,
        },
      });
      sendCreated(res, employee);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/v1/employees/:id
router.put(
  '/:id',
  requirePermission('employees', 'write'),
  validateId,
  validateBody(updateEmployeeSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.employee.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Empleado', req.params.id);

      const employee = await prisma.employee.update({
        where: { id: req.params.id },
        data: req.body,
      });
      sendSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/employees/:id
router.delete(
  '/:id',
  requirePermission('employees', 'delete'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.employee.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Empleado', req.params.id);

      await prisma.employee.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date(), isActive: false },
      });
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/employees/:id/attendance
router.get('/:id/attendance', requirePermission('attendance', 'read'), validateId, async (req, res, next) => {
  try {
    const { month, year } = req.query as { month?: string; year?: string };

    let dateFilter: Prisma.AttendanceWhereInput = {};
    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      dateFilter = {
        date: { gte: startDate, lte: endDate },
      };
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        employeeId: req.params.id,
        ...dateFilter,
      },
      orderBy: { date: 'desc' },
    });
    sendSuccess(res, attendance);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/employees/:id/attendance
router.post(
  '/:id/attendance',
  requirePermission('attendance', 'write'),
  validateId,
  validateBody(createAttendanceSchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.employee.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
        },
      });
      if (!existing) throw new NotFoundError('Empleado', req.params.id);

      const attendance = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: req.params.id,
            date: new Date(req.body.date),
          },
        },
        create: {
          ...req.body,
          employeeId: req.params.id,
          date: new Date(req.body.date),
        },
        update: {
          ...req.body,
          date: new Date(req.body.date),
        },
      });
      sendCreated(res, attendance);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/employees/:id/projects
router.get('/:id/projects', requirePermission('employees', 'read'), validateId, async (req, res, next) => {
  try {
    const assignments = await prisma.employeeProjectAssignment.findMany({
      where: { employeeId: req.params.id },
      include: {
        project: {
          select: { id: true, code: true, name: true, status: true, progress: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
    sendSuccess(res, assignments);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/attendance/bulk
router.post(
  '/attendance/bulk',
  requirePermission('attendance', 'write'),
  validateBody(bulkAttendanceSchema),
  async (req, res, next) => {
    try {
      const { date, records } = req.body;

      const results = await Promise.all(
        records.map((record: any) =>
          prisma.attendance.upsert({
            where: {
              employeeId_date: {
                employeeId: record.employeeId,
                date: new Date(date),
              },
            },
            create: {
              employeeId: record.employeeId,
              date: new Date(date),
              type: record.type,
              checkIn: record.checkIn ? new Date(record.checkIn) : null,
              checkOut: record.checkOut ? new Date(record.checkOut) : null,
              notes: record.notes,
            },
            update: {
              type: record.type,
              checkIn: record.checkIn ? new Date(record.checkIn) : null,
              checkOut: record.checkOut ? new Date(record.checkOut) : null,
              notes: record.notes,
            },
          })
        )
      );

      sendSuccess(res, { updated: results.length });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/v1/attendance/report
router.get('/attendance/report', requirePermission('attendance', 'read'), async (req, res, next) => {
  try {
    const { startDate, endDate, projectId } = req.query as {
      startDate?: string;
      endDate?: string;
      projectId?: string;
    };

    let employeeIds: string[] | undefined;

    if (projectId) {
      const assignments = await prisma.employeeProjectAssignment.findMany({
        where: { projectId, isActive: true },
        select: { employeeId: true },
      });
      employeeIds = assignments.map((a) => a.employeeId);
    }

    const attendance = await prisma.attendance.groupBy({
      by: ['employeeId', 'type'],
      where: {
        employee: { organizationId: req.user!.organizationId },
        ...(startDate && endDate && {
          date: { gte: new Date(startDate), lte: new Date(endDate) },
        }),
        ...(employeeIds && { employeeId: { in: employeeIds } }),
      },
      _count: true,
      _sum: { hoursWorked: true, overtimeHours: true },
    });

    sendSuccess(res, attendance);
  } catch (error) {
    next(error);
  }
});

export { router as employeesRoutes };
