import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateId } from '../../middleware/validation.middleware';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/attendance
router.get('/', requirePermission('employees', 'read'), attendanceController.findAll.bind(attendanceController));

// GET /api/v1/attendance/summary/:year/:month
router.get('/summary/:year/:month', requirePermission('employees', 'read'), attendanceController.getMonthlySummary.bind(attendanceController));

// POST /api/v1/attendance — upsert (create or update by employeeId+date)
router.post('/', requirePermission('employees', 'write'), attendanceController.upsert.bind(attendanceController));

// DELETE /api/v1/attendance/:id
router.delete('/:id', requirePermission('employees', 'write'), validateId, attendanceController.delete.bind(attendanceController));

export { router as attendanceRoutes };
