import { Router } from 'express';
import { auditLogController } from './audit-log.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authMiddleware);

// GET /api/v1/audit-log — ADMIN only
router.get('/', requirePermission('users', 'read'), auditLogController.findAll.bind(auditLogController));

export { router as auditLogRoutes };
