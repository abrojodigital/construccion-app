import { Router } from 'express';
import { subcontractsController } from './subcontracts.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateQuery, validateId } from '../../middleware/validation.middleware';
import {
  createSubcontractSchema,
  updateSubcontractSchema,
  createSubcontractItemSchema,
  createSubcontractCertificateSchema,
  updateSubcontractCertificateItemSchema,
  subcontractQuerySchema,
} from '@construccion/shared';

const router: Router = Router({ mergeParams: true });

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

// ============================================
// Rutas montadas en: /projects/:projectId/subcontracts
// ============================================

// POST /projects/:projectId/subcontracts - Crear subcontratacion
router.post(
  '/',
  requirePermission('subcontracts', 'write'),
  validateBody(createSubcontractSchema),
  subcontractsController.create.bind(subcontractsController)
);

// GET /projects/:projectId/subcontracts - Listar subcontrataciones del proyecto
router.get(
  '/',
  requirePermission('subcontracts', 'read'),
  validateQuery(subcontractQuerySchema),
  subcontractsController.findAll.bind(subcontractsController)
);

// ============================================
// Rutas montadas en: /subcontracts
// ============================================

// GET /subcontracts/:id - Detalle de subcontratacion con items y certificados
router.get(
  '/:id',
  requirePermission('subcontracts', 'read'),
  validateId,
  subcontractsController.findById.bind(subcontractsController)
);

// PUT /subcontracts/:id - Actualizar subcontratacion (solo DRAFT)
router.put(
  '/:id',
  requirePermission('subcontracts', 'write'),
  validateId,
  validateBody(updateSubcontractSchema),
  subcontractsController.update.bind(subcontractsController)
);

// DELETE /subcontracts/:id - Eliminar subcontratacion (soft delete, solo DRAFT)
router.delete(
  '/:id',
  requirePermission('subcontracts', 'delete'),
  validateId,
  subcontractsController.delete.bind(subcontractsController)
);

// POST /subcontracts/:id/activate - Activar subcontratacion (DRAFT -> ACTIVE)
router.post(
  '/:id/activate',
  requirePermission('subcontracts', 'write'),
  validateId,
  subcontractsController.activate.bind(subcontractsController)
);

// ============================================
// Items de Subcontratacion
// ============================================

// POST /subcontracts/:id/items - Agregar item a subcontratacion
router.post(
  '/:id/items',
  requirePermission('subcontracts', 'write'),
  validateId,
  validateBody(createSubcontractItemSchema),
  subcontractsController.addItem.bind(subcontractsController)
);

// DELETE /subcontracts/:id/items/:itemId - Eliminar item (solo DRAFT)
router.delete(
  '/:id/items/:itemId',
  requirePermission('subcontracts', 'delete'),
  subcontractsController.removeItem.bind(subcontractsController)
);

// ============================================
// Certificados de Subcontratacion
// ============================================

// POST /subcontracts/:id/certificates - Crear certificado
router.post(
  '/:id/certificates',
  requirePermission('subcontracts', 'write'),
  validateId,
  validateBody(createSubcontractCertificateSchema),
  subcontractsController.createCertificate.bind(subcontractsController)
);

// PUT /subcontracts/:id/certificates/:certId/items/:itemId - Actualizar avance de item
router.put(
  '/:id/certificates/:certId/items/:itemId',
  requirePermission('subcontracts', 'write'),
  validateBody(updateSubcontractCertificateItemSchema),
  subcontractsController.updateCertificateItem.bind(subcontractsController)
);

// POST /subcontracts/:id/certificates/:certId/approve - Aprobar certificado
router.post(
  '/:id/certificates/:certId/approve',
  requirePermission('subcontracts', 'approve'),
  subcontractsController.approveCertificate.bind(subcontractsController)
);

export { router as subcontractsRoutes };
