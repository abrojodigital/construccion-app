import { Router } from 'express';
import { priceAnalysisController } from './price-analysis.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import {
  createAnalysisMaterialSchema,
  createAnalysisLaborSchema,
  createAnalysisEquipmentSchema,
  createAnalysisTransportSchema,
} from '@construccion/shared';

const router: Router = Router({ mergeParams: true });

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

// ============================================
// Rutas montadas en: /budget-items/:budgetItemId/price-analysis
// ============================================

// GET /budget-items/:budgetItemId/price-analysis - Obtener APU de un item
router.get(
  '/',
  requirePermission('price_analysis', 'read'),
  priceAnalysisController.findByBudgetItem.bind(priceAnalysisController)
);

// POST /budget-items/:budgetItemId/price-analysis - Crear APU para un item
router.post(
  '/',
  requirePermission('price_analysis', 'write'),
  priceAnalysisController.create.bind(priceAnalysisController)
);

// ============================================
// Rutas montadas en: /price-analyses
// ============================================

// DELETE /price-analyses/:id - Eliminar un APU completo
router.delete(
  '/:id',
  requirePermission('price_analysis', 'delete'),
  validateId,
  priceAnalysisController.delete.bind(priceAnalysisController)
);

// POST /price-analyses/:id/recalculate - Recalcular totales del APU
router.post(
  '/:id/recalculate',
  requirePermission('price_analysis', 'write'),
  validateId,
  priceAnalysisController.recalculate.bind(priceAnalysisController)
);

// ============================================
// Sub-items: Materiales (seccion A)
// ============================================

// POST /price-analyses/:id/materials - Agregar material
router.post(
  '/:id/materials',
  requirePermission('price_analysis', 'write'),
  validateId,
  validateBody(createAnalysisMaterialSchema),
  priceAnalysisController.addMaterial.bind(priceAnalysisController)
);

// ============================================
// Sub-items: Mano de Obra (seccion B)
// ============================================

// POST /price-analyses/:id/labor - Agregar mano de obra
router.post(
  '/:id/labor',
  requirePermission('price_analysis', 'write'),
  validateId,
  validateBody(createAnalysisLaborSchema),
  priceAnalysisController.addLabor.bind(priceAnalysisController)
);

// ============================================
// Sub-items: Equipos (secciones D, E, F)
// ============================================

// POST /price-analyses/:id/equipment - Agregar equipo
router.post(
  '/:id/equipment',
  requirePermission('price_analysis', 'write'),
  validateId,
  validateBody(createAnalysisEquipmentSchema),
  priceAnalysisController.addEquipment.bind(priceAnalysisController)
);

// ============================================
// Sub-items: Transporte (seccion C)
// ============================================

// POST /price-analyses/:id/transport - Agregar transporte
router.post(
  '/:id/transport',
  requirePermission('price_analysis', 'write'),
  validateId,
  validateBody(createAnalysisTransportSchema),
  priceAnalysisController.addTransport.bind(priceAnalysisController)
);

// ============================================
// Eliminar sub-item generico
// ============================================

// DELETE /price-analyses/:id/:type/:itemId - Eliminar sub-item (materials|labor|equipment|transport)
router.delete(
  '/:id/:type/:itemId',
  requirePermission('price_analysis', 'delete'),
  priceAnalysisController.removeItem.bind(priceAnalysisController)
);

export { router as priceAnalysisRoutes };
