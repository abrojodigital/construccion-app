import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import { projectsController } from './projects.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { validateBody, validateQuery, validateId } from '../../middleware/validation.middleware';
import { createProjectSchema, updateProjectSchema, projectQuerySchema } from '@construccion/shared';
import { prisma } from '@construccion/database';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';
import { NotFoundError } from '../../shared/utils/errors';

const upload = multer({
  dest: '/tmp/uploads',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/projects - List all projects
router.get(
  '/',
  requirePermission('projects', 'read'),
  validateQuery(projectQuerySchema),
  projectsController.findAll.bind(projectsController)
);

// GET /api/v1/projects/:id - Get project by ID
router.get(
  '/:id',
  requirePermission('projects', 'read'),
  validateId,
  projectsController.findById.bind(projectsController)
);

// POST /api/v1/projects - Create project
router.post(
  '/',
  requirePermission('projects', 'write'),
  validateBody(createProjectSchema),
  projectsController.create.bind(projectsController)
);

// PUT /api/v1/projects/:id - Update project
router.put(
  '/:id',
  requirePermission('projects', 'write'),
  validateId,
  validateBody(updateProjectSchema),
  projectsController.update.bind(projectsController)
);

// DELETE /api/v1/projects/:id - Delete project
router.delete(
  '/:id',
  requirePermission('projects', 'delete'),
  validateId,
  projectsController.delete.bind(projectsController)
);

// GET /api/v1/projects/:id/summary - Get project summary
router.get(
  '/:id/summary',
  requirePermission('projects', 'read'),
  validateId,
  projectsController.getSummary.bind(projectsController)
);

// GET /api/v1/projects/:id/gantt - Get Gantt chart data
router.get(
  '/:id/gantt',
  requirePermission('projects', 'read'),
  validateId,
  projectsController.getGanttData.bind(projectsController)
);

// GET /api/v1/projects/:id/budget-status - Get budget status
router.get(
  '/:id/budget-status',
  requirePermission('projects', 'read'),
  validateId,
  projectsController.getBudgetStatus.bind(projectsController)
);

// ============================================
// Equipo del proyecto
// ============================================

// GET /api/v1/projects/:id/team - Listar asignaciones
router.get(
  '/:id/team',
  requirePermission('projects', 'read'),
  validateId,
  async (req, res, next) => {
    try {
      const assignments = await prisma.employeeProjectAssignment.findMany({
        where: {
          projectId: req.params.id,
          project: { organizationId: req.user!.organizationId },
        },
        include: {
          employee: {
            select: {
              id: true,
              legajo: true,
              firstName: true,
              lastName: true,
              specialty: true,
              department: true,
              position: true,
              isActive: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      });
      sendSuccess(res, assignments);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/projects/:id/team - Asignar empleado al proyecto
router.post(
  '/:id/team',
  requirePermission('projects', 'write'),
  validateId,
  async (req, res, next) => {
    try {
      const { employeeId, role, startDate, hourlyRateOverride } = req.body;

      const project = await prisma.project.findFirst({
        where: { id: req.params.id, organizationId: req.user!.organizationId, deletedAt: null },
      });
      if (!project) throw new NotFoundError('Proyecto', req.params.id);

      // Validar que el empleado pertenezca a la misma organización
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, organizationId: req.user!.organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!employee) throw new NotFoundError('Empleado', employeeId);

      const assignment = await prisma.employeeProjectAssignment.upsert({
        where: { employeeId_projectId: { employeeId, projectId: req.params.id } },
        create: {
          employeeId,
          projectId: req.params.id,
          role,
          startDate: startDate ? new Date(startDate) : new Date(),
          hourlyRateOverride,
          isActive: true,
        },
        update: {
          role,
          isActive: true,
          startDate: startDate ? new Date(startDate) : undefined,
          hourlyRateOverride,
        },
        include: {
          employee: {
            select: {
              id: true,
              legajo: true,
              firstName: true,
              lastName: true,
              specialty: true,
              position: true,
            },
          },
        },
      });

      sendCreated(res, assignment);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/projects/:id/team/:assignmentId - Remover empleado
router.delete(
  '/:id/team/:assignmentId',
  requirePermission('projects', 'write'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.employeeProjectAssignment.findFirst({
        where: {
          id: req.params.assignmentId,
          projectId: req.params.id,
          project: { organizationId: req.user!.organizationId },
        },
      });
      if (!existing) throw new NotFoundError('Asignación', req.params.assignmentId);

      await prisma.employeeProjectAssignment.update({
        where: { id: req.params.assignmentId },
        data: { isActive: false, endDate: new Date() },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// Documentos del proyecto
// ============================================

// GET /api/v1/projects/:id/documents - Listar documentos
router.get(
  '/:id/documents',
  requirePermission('projects', 'read'),
  validateId,
  async (req, res, next) => {
    try {
      const documents = await prisma.document.findMany({
        where: {
          projectId: req.params.id,
          project: { organizationId: req.user!.organizationId },
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });
      sendSuccess(res, documents);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/v1/projects/:id/documents - Subir documento
router.post(
  '/:id/documents',
  requirePermission('projects', 'write'),
  validateId,
  upload.single('file'),
  async (req, res, next) => {
    try {
      const project = await prisma.project.findFirst({
        where: { id: req.params.id, organizationId: req.user!.organizationId, deletedAt: null },
      });
      if (!project) throw new NotFoundError('Proyecto', req.params.id);

      const file = req.file;
      const document = await prisma.document.create({
        data: {
          name: req.body.name || file?.originalname || 'Documento',
          description: req.body.description,
          category: req.body.category,
          filePath: file?.path || req.body.filePath || '',
          fileSize: file?.size || 0,
          mimeType: file?.mimetype || req.body.mimeType || 'application/octet-stream',
          projectId: req.params.id,
        },
      });

      sendCreated(res, document);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/projects/:id/documents/:documentId - Eliminar documento
router.delete(
  '/:id/documents/:documentId',
  requirePermission('projects', 'delete'),
  validateId,
  async (req, res, next) => {
    try {
      const existing = await prisma.document.findFirst({
        where: {
          id: req.params.documentId,
          projectId: req.params.id,
          project: { organizationId: req.user!.organizationId },
          deletedAt: null,
        },
      });
      if (!existing) throw new NotFoundError('Documento', req.params.documentId);

      await prisma.document.update({
        where: { id: req.params.documentId },
        data: { deletedAt: new Date() },
      });

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
);

export { router as projectsRoutes };
