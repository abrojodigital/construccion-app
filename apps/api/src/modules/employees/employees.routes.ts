import { Router } from 'express';
import { employeesController } from './employees.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId, validateQuery } from '../../middleware/validation.middleware';
import { createEmployeeSchema, updateEmployeeSchema, createAttendanceSchema, bulkAttendanceSchema, paginationSchema } from '@construccion/shared';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/employees
router.get(
  '/',
  requirePermission('employees', 'read'),
  validateQuery(paginationSchema),
  employeesController.findAll.bind(employeesController)
);

// GET /api/v1/employees/available - Empleados disponibles para asignar a un proyecto
router.get(
  '/available',
  requirePermission('employees', 'read'),
  employeesController.findAvailable.bind(employeesController)
);

// POST /api/v1/attendance/bulk
router.post(
  '/attendance/bulk',
  requirePermission('attendance', 'write'),
  validateBody(bulkAttendanceSchema),
  employeesController.bulkAttendance.bind(employeesController)
);

// GET /api/v1/attendance/report
router.get(
  '/attendance/report',
  requirePermission('attendance', 'read'),
  employeesController.attendanceReport.bind(employeesController)
);

// GET /api/v1/employees/:id
router.get(
  '/:id',
  requirePermission('employees', 'read'),
  validateId,
  employeesController.findById.bind(employeesController)
);

// POST /api/v1/employees
router.post(
  '/',
  requirePermission('employees', 'write'),
  validateBody(createEmployeeSchema),
  employeesController.create.bind(employeesController)
);

// PUT /api/v1/employees/:id
router.put(
  '/:id',
  requirePermission('employees', 'write'),
  validateId,
  validateBody(updateEmployeeSchema),
  employeesController.update.bind(employeesController)
);

// DELETE /api/v1/employees/:id
router.delete(
  '/:id',
  requirePermission('employees', 'delete'),
  validateId,
  employeesController.delete.bind(employeesController)
);

// GET /api/v1/employees/:id/attendance
router.get(
  '/:id/attendance',
  requirePermission('attendance', 'read'),
  validateId,
  employeesController.findAttendance.bind(employeesController)
);

// POST /api/v1/employees/:id/attendance
router.post(
  '/:id/attendance',
  requirePermission('attendance', 'write'),
  validateId,
  validateBody(createAttendanceSchema),
  employeesController.createAttendance.bind(employeesController)
);

// GET /api/v1/employees/:id/projects
router.get(
  '/:id/projects',
  requirePermission('employees', 'read'),
  validateId,
  employeesController.findProjects.bind(employeesController)
);

export { router as employeesRoutes };
