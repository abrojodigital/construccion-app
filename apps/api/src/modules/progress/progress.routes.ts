import { Router } from 'express';
import { progressController } from './progress.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import { createItemProgressSchema } from '@construccion/shared';

const router: Router = Router({ mergeParams: true });

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

// ============================================
// Rutas montadas en: /budget-items/:budgetItemId/progress
// ============================================

// POST /budget-items/:budgetItemId/progress - Registrar avance fisico de un item
router.post(
  '/',
  requirePermission('progress', 'write'),
  validateBody(createItemProgressSchema),
  progressController.registerProgress.bind(progressController)
);

// GET /budget-items/:budgetItemId/progress - Obtener historial de avance de un item
router.get(
  '/',
  requirePermission('progress', 'read'),
  progressController.getHistory.bind(progressController)
);

// ============================================
// Rutas montadas en: /progress
// ============================================

// DELETE /progress/:id - Eliminar una entrada de avance
router.delete(
  '/:id',
  requirePermission('progress', 'delete'),
  validateId,
  progressController.deleteProgress.bind(progressController)
);

// ============================================
// Rutas montadas en: /budget-versions/:budgetVersionId/progress-summary
// ============================================

// GET /budget-versions/:budgetVersionId/progress-summary - Resumen de avance por version
router.get(
  '/summary',
  requirePermission('progress', 'read'),
  progressController.getProgressSummary.bind(progressController)
);

export { router as progressRoutes };
