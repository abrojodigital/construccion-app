import { Router } from 'express';
import { equipmentCatalogController } from './equipment-catalog.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateId } from '../../middleware/validation.middleware';
import {
  createEquipmentCatalogSchema,
  updateEquipmentCatalogSchema,
} from '@construccion/shared';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /equipment-catalog — Crear equipo en catálogo
router.post(
  '/',
  requirePermission('equipment_catalog', 'write'),
  validateBody(createEquipmentCatalogSchema),
  equipmentCatalogController.create.bind(equipmentCatalogController)
);

// GET /equipment-catalog — Listar equipos
router.get(
  '/',
  requirePermission('equipment_catalog', 'read'),
  equipmentCatalogController.findAll.bind(equipmentCatalogController)
);

// GET /equipment-catalog/:id — Obtener equipo
router.get(
  '/:id',
  requirePermission('equipment_catalog', 'read'),
  validateId,
  equipmentCatalogController.findById.bind(equipmentCatalogController)
);

// PUT /equipment-catalog/:id — Actualizar equipo
router.put(
  '/:id',
  requirePermission('equipment_catalog', 'write'),
  validateId,
  validateBody(updateEquipmentCatalogSchema),
  equipmentCatalogController.update.bind(equipmentCatalogController)
);

// DELETE /equipment-catalog/:id — Eliminar equipo (soft delete)
router.delete(
  '/:id',
  requirePermission('equipment_catalog', 'delete'),
  validateId,
  equipmentCatalogController.delete.bind(equipmentCatalogController)
);

export { router as equipmentCatalogRoutes };
