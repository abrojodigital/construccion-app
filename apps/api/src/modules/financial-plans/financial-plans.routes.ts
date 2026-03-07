import { Router } from 'express';
import { financialPlansController } from './financial-plans.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import {
  createFinancialPlanSchema,
  updateFinancialPlanSchema,
  createFinancialPeriodSchema,
  updateFinancialPeriodSchema,
} from '@construccion/shared';

const router: Router = Router({ mergeParams: true });

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============================================
// PLANES FINANCIEROS
// ============================================

// POST / (montado en /projects/:projectId/financial-plans)
router.post(
  '/',
  requirePermission('financial_plans', 'write'),
  validateBody(createFinancialPlanSchema),
  financialPlansController.create.bind(financialPlansController)
);

// GET / (funciona en ambos puntos de montaje)
router.get(
  '/',
  requirePermission('financial_plans', 'read'),
  financialPlansController.findAll.bind(financialPlansController)
);

// GET /:id — Obtener plan con períodos
router.get(
  '/:id',
  requirePermission('financial_plans', 'read'),
  validateId,
  financialPlansController.findById.bind(financialPlansController)
);

// PUT /:id — Actualizar plan (solo DRAFT)
router.put(
  '/:id',
  requirePermission('financial_plans', 'write'),
  validateId,
  validateBody(updateFinancialPlanSchema),
  financialPlansController.update.bind(financialPlansController)
);

// DELETE /:id — Eliminar plan (soft delete, solo DRAFT)
router.delete(
  '/:id',
  requirePermission('financial_plans', 'delete'),
  validateId,
  financialPlansController.delete.bind(financialPlansController)
);

// POST /:id/approve — Aprobar plan
router.post(
  '/:id/approve',
  requirePermission('financial_plans', 'approve'),
  validateId,
  financialPlansController.approve.bind(financialPlansController)
);

// ============================================
// PERÍODOS FINANCIEROS
// ============================================

// POST /:id/periods — Agregar período a plan
router.post(
  '/:id/periods',
  requirePermission('financial_plans', 'write'),
  validateId,
  validateBody(createFinancialPeriodSchema),
  financialPlansController.addPeriod.bind(financialPlansController)
);

// PUT /periods/:periodId — Actualizar período
router.put(
  '/periods/:periodId',
  requirePermission('financial_plans', 'write'),
  validateBody(updateFinancialPeriodSchema),
  financialPlansController.updatePeriod.bind(financialPlansController)
);

// DELETE /periods/:periodId — Eliminar período
router.delete(
  '/periods/:periodId',
  requirePermission('financial_plans', 'delete'),
  financialPlansController.deletePeriod.bind(financialPlansController)
);

export { router as financialPlansRoutes };
