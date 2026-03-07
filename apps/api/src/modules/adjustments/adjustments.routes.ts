import { Router } from 'express';
import { adjustmentsController } from './adjustments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import {
  createPriceIndexSchema,
  createPriceIndexValueSchema,
  createAdjustmentFormulaSchema,
  calculateAdjustmentSchema,
} from '@construccion/shared';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============================================
// ÍNDICES DE PRECIOS - /adjustments/indices
// ============================================

// POST /adjustments/indices - Crear índice de precios
router.post(
  '/indices',
  requirePermission('adjustments', 'write'),
  validateBody(createPriceIndexSchema),
  adjustmentsController.createIndex.bind(adjustmentsController)
);

// GET /adjustments/indices - Listar índices de precios
router.get(
  '/indices',
  requirePermission('adjustments', 'read'),
  adjustmentsController.findAllIndices.bind(adjustmentsController)
);

// GET /adjustments/indices/:id - Obtener índice con valores
router.get(
  '/indices/:id',
  requirePermission('adjustments', 'read'),
  validateId,
  adjustmentsController.findIndexById.bind(adjustmentsController)
);

// POST /adjustments/indices/:id/values - Agregar valor al índice
router.post(
  '/indices/:id/values',
  requirePermission('adjustments', 'write'),
  validateId,
  validateBody(createPriceIndexValueSchema),
  adjustmentsController.addIndexValue.bind(adjustmentsController)
);

// DELETE /adjustments/indices/:id - Eliminar índice
router.delete(
  '/indices/:id',
  requirePermission('adjustments', 'delete'),
  validateId,
  adjustmentsController.deleteIndex.bind(adjustmentsController)
);

// ============================================
// FÓRMULAS DE AJUSTE - /adjustments/formulas
// ============================================

// POST /adjustments/formulas - Crear fórmula polinómica
router.post(
  '/formulas',
  requirePermission('adjustments', 'write'),
  validateBody(createAdjustmentFormulaSchema),
  adjustmentsController.createFormula.bind(adjustmentsController)
);

// GET /adjustments/formulas - Listar fórmulas
router.get(
  '/formulas',
  requirePermission('adjustments', 'read'),
  adjustmentsController.findAllFormulas.bind(adjustmentsController)
);

// GET /adjustments/formulas/:id - Obtener fórmula con pesos
router.get(
  '/formulas/:id',
  requirePermission('adjustments', 'read'),
  validateId,
  adjustmentsController.findFormulaById.bind(adjustmentsController)
);

// DELETE /adjustments/formulas/:id - Eliminar fórmula
router.delete(
  '/formulas/:id',
  requirePermission('adjustments', 'delete'),
  validateId,
  adjustmentsController.deleteFormula.bind(adjustmentsController)
);

// ============================================
// CÁLCULO DE REDETERMINACIÓN - /adjustments/calculate
// ============================================

// POST /adjustments/calculate - Calcular factor de ajuste
router.post(
  '/calculate',
  requirePermission('adjustments', 'read'),
  validateBody(calculateAdjustmentSchema),
  adjustmentsController.calculateFactor.bind(adjustmentsController)
);

export { router as adjustmentsRoutes };
