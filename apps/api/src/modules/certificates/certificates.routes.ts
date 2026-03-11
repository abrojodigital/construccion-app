import { Router } from 'express';
import { certificatesController } from './certificates.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateQuery, validateId } from '../../middleware/validation.middleware';
import {
  createCertificateSchema,
  updateCertificateSchema,
  updateCertificateItemSchema,
  rejectCertificateSchema,
  annulCertificateSchema,
  certificateQuerySchema,
} from '@construccion/shared';

const router: Router = Router({ mergeParams: true });

// Todas las rutas requieren autenticacion
router.use(authMiddleware);

// ============================================
// Rutas montadas en: /projects/:projectId/certificates
// ============================================

// POST /projects/:projectId/certificates - Crear certificado
router.post(
  '/',
  requirePermission('certificates', 'write'),
  validateBody(createCertificateSchema),
  certificatesController.create.bind(certificatesController)
);

// GET /projects/:projectId/certificates - Listar certificados del proyecto
router.get(
  '/',
  requirePermission('certificates', 'read'),
  validateQuery(certificateQuerySchema),
  certificatesController.findAll.bind(certificatesController)
);

// ============================================
// Rutas montadas en: /certificates
// ============================================

// GET /certificates/:id - Detalle del certificado con items
router.get(
  '/:id',
  requirePermission('certificates', 'read'),
  validateId,
  certificatesController.findById.bind(certificatesController)
);

// PUT /certificates/:id - Actualizar campos editables (factor de ajuste, solo DRAFT)
router.put(
  '/:id',
  requirePermission('certificates', 'write'),
  validateId,
  validateBody(updateCertificateSchema),
  certificatesController.update.bind(certificatesController)
);

// PUT /certificates/:id/items/:itemId - Actualizar avance de un item
router.put(
  '/:id/items/:itemId',
  requirePermission('certificates', 'write'),
  validateId,
  validateBody(updateCertificateItemSchema),
  certificatesController.updateItem.bind(certificatesController)
);

// POST /certificates/:id/submit - Presentar certificado para aprobacion
router.post(
  '/:id/submit',
  requirePermission('certificates', 'write'),
  validateId,
  certificatesController.submit.bind(certificatesController)
);

// POST /certificates/:id/approve - Aprobar certificado
router.post(
  '/:id/approve',
  requirePermission('certificates', 'approve'),
  validateId,
  certificatesController.approve.bind(certificatesController)
);

// POST /certificates/:id/mark-paid - Marcar como pagado (APPROVED -> PAID)
router.post(
  '/:id/mark-paid',
  requirePermission('certificates', 'approve'),
  validateId,
  certificatesController.markAsPaid.bind(certificatesController)
);

// POST /certificates/:id/reject - Rechazar certificado enviado (SUBMITTED -> REJECTED)
router.post(
  '/:id/reject',
  requirePermission('certificates', 'approve'),
  validateId,
  validateBody(rejectCertificateSchema),
  certificatesController.reject.bind(certificatesController)
);

// POST /certificates/:id/reopen - Reabrir certificado rechazado (REJECTED -> DRAFT)
router.post(
  '/:id/reopen',
  requirePermission('certificates', 'write'),
  validateId,
  certificatesController.reopen.bind(certificatesController)
);

// POST /certificates/:id/annul - Anular certificado aprobado o pagado (irreversible)
router.post(
  '/:id/annul',
  requirePermission('certificates', 'approve'),
  validateId,
  validateBody(annulCertificateSchema),
  certificatesController.annul.bind(certificatesController)
);

// GET /certificates/:id/export/pdf - Exportar como HTML/PDF
router.get(
  '/:id/export/pdf',
  requirePermission('certificates', 'read'),
  validateId,
  certificatesController.exportPdf.bind(certificatesController)
);

// GET /certificates/:id/export/excel - Exportar como CSV/Excel
router.get(
  '/:id/export/excel',
  requirePermission('certificates', 'read'),
  validateId,
  certificatesController.exportExcel.bind(certificatesController)
);

// DELETE /certificates/:id - Eliminar certificado (solo DRAFT)
router.delete(
  '/:id',
  requirePermission('certificates', 'delete'),
  validateId,
  certificatesController.delete.bind(certificatesController)
);

export { router as certificatesRoutes };
