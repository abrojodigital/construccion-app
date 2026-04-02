import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { budgetVersionsController } from './budget-versions.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateQuery, validateId } from '../../middleware/validation.middleware';
import {
  createBudgetVersionSchema,
  updateBudgetVersionSchema,
  createBudgetCategorySchema,
  updateBudgetCategorySchema,
  createBudgetStageSchema,
  updateBudgetStageSchema,
  createBudgetItemSchema,
  updateBudgetItemSchema,
  budgetVersionQuerySchema,
  generateScheduleSchema,
  confirmImportSchema,
} from '@construccion/shared';

const router: Router = Router({ mergeParams: true });

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      err.message = 'Formato no soportado. Solo se aceptan archivos .xlsx y .xls';
      cb(err);
    }
  },
});

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /projects/:projectId/budget-versions/import/parse — Parsear Excel (preview)
router.post(
  '/import/parse',
  requirePermission('budget_versions', 'write'),
  uploadExcel.single('file'),
  budgetVersionsController.parseImport.bind(budgetVersionsController)
);

// POST /projects/:projectId/budget-versions/import/confirm — Confirmar importación
router.post(
  '/import/confirm',
  requirePermission('budget_versions', 'write'),
  validateBody(confirmImportSchema),
  budgetVersionsController.confirmImport.bind(budgetVersionsController)
);

// ============================================
// Versiones de Presupuesto
// Montadas en: /projects/:projectId/budget-versions
// ============================================

// GET /projects/:projectId/budget-versions — Listar versiones
router.get(
  '/',
  requirePermission('budget_versions', 'read'),
  validateQuery(budgetVersionQuerySchema),
  budgetVersionsController.findAll.bind(budgetVersionsController)
);

// POST /projects/:projectId/budget-versions — Crear versión
router.post(
  '/',
  requirePermission('budget_versions', 'write'),
  validateBody(createBudgetVersionSchema),
  budgetVersionsController.create.bind(budgetVersionsController)
);

// GET /budget-versions/:id — Detalle con categorías, etapas e ítems
router.get(
  '/:id',
  requirePermission('budget_versions', 'read'),
  validateId,
  budgetVersionsController.findById.bind(budgetVersionsController)
);

// PUT /budget-versions/:id — Editar versión (solo DRAFT)
router.put(
  '/:id',
  requirePermission('budget_versions', 'write'),
  validateId,
  validateBody(updateBudgetVersionSchema),
  budgetVersionsController.update.bind(budgetVersionsController)
);

// DELETE /budget-versions/:id — Eliminar versión (soft, no APPROVED)
router.delete(
  '/:id',
  requirePermission('budget_versions', 'delete'),
  validateId,
  budgetVersionsController.delete.bind(budgetVersionsController)
);

// POST /budget-versions/:id/approve — Aprobar versión
router.post(
  '/:id/approve',
  requirePermission('budget_versions', 'approve'),
  validateId,
  budgetVersionsController.approve.bind(budgetVersionsController)
);

// POST /budget-versions/:id/revert-to-draft — Revertir a borrador
router.post(
  '/:id/revert-to-draft',
  requirePermission('budget_versions', 'approve'),
  validateId,
  budgetVersionsController.revertToDraft.bind(budgetVersionsController)
);

// POST /budget-versions/:id/recalculate — Recalcular K y totales
router.post(
  '/:id/recalculate',
  requirePermission('budget_versions', 'write'),
  validateId,
  budgetVersionsController.recalculate.bind(budgetVersionsController)
);

// ============================================
// Categorías (Nivel 1)
// ============================================

// POST /budget-versions/:id/categories — Crear categoría
router.post(
  '/:id/categories',
  requirePermission('budget_versions', 'write'),
  validateId,
  validateBody(createBudgetCategorySchema),
  budgetVersionsController.createCategory.bind(budgetVersionsController)
);

// PUT /budget-versions/:id/categories/:categoryId — Editar categoría
router.put(
  '/:id/categories/:categoryId',
  requirePermission('budget_versions', 'write'),
  validateBody(updateBudgetCategorySchema),
  budgetVersionsController.updateCategory.bind(budgetVersionsController)
);

// DELETE /budget-versions/:id/categories/:categoryId — Eliminar categoría
router.delete(
  '/:id/categories/:categoryId',
  requirePermission('budget_versions', 'delete'),
  budgetVersionsController.deleteCategory.bind(budgetVersionsController)
);

// ============================================
// Etapas (Nivel 2)
// ============================================

// POST /budget-versions/:id/categories/:categoryId/stages — Crear etapa
router.post(
  '/:id/categories/:categoryId/stages',
  requirePermission('budget_versions', 'write'),
  validateBody(createBudgetStageSchema),
  budgetVersionsController.createStage.bind(budgetVersionsController)
);

// PUT /budget-versions/:id/stages/:stageId — Editar etapa
router.put(
  '/:id/stages/:stageId',
  requirePermission('budget_versions', 'write'),
  validateBody(updateBudgetStageSchema),
  budgetVersionsController.updateStage.bind(budgetVersionsController)
);

// DELETE /budget-versions/:id/stages/:stageId — Eliminar etapa
router.delete(
  '/:id/stages/:stageId',
  requirePermission('budget_versions', 'delete'),
  budgetVersionsController.deleteStage.bind(budgetVersionsController)
);

// ============================================
// Ítems (Nivel 3)
// ============================================

// POST /budget-versions/:id/stages/:stageId/items — Crear ítem
router.post(
  '/:id/stages/:stageId/items',
  requirePermission('budget_versions', 'write'),
  validateBody(createBudgetItemSchema),
  budgetVersionsController.createItem.bind(budgetVersionsController)
);

// PUT /budget-versions/:id/items/:itemId — Editar ítem
router.put(
  '/:id/items/:itemId',
  requirePermission('budget_versions', 'write'),
  validateBody(updateBudgetItemSchema),
  budgetVersionsController.updateItem.bind(budgetVersionsController)
);

// DELETE /budget-versions/:id/items/:itemId — Eliminar ítem
router.delete(
  '/:id/items/:itemId',
  requirePermission('budget_versions', 'delete'),
  budgetVersionsController.deleteItem.bind(budgetVersionsController)
);

// ============================================
// Generación de Cronograma
// ============================================

// GET /budget-versions/:id/schedule/check — Verificar cronograma existente
router.get(
  '/:id/schedule/check',
  requirePermission('budget_versions', 'read'),
  validateId,
  budgetVersionsController.checkSchedule.bind(budgetVersionsController)
);

// POST /budget-versions/:id/schedule/generate — Generar cronograma desde presupuesto
router.post(
  '/:id/schedule/generate',
  requirePermission('budget_versions', 'write'),
  validateId,
  validateBody(generateScheduleSchema),
  budgetVersionsController.generateSchedule.bind(budgetVersionsController)
);

export { router as budgetVersionsRoutes };
