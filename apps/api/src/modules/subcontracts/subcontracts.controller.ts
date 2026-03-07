import { Request, Response, NextFunction } from 'express';
import { subcontractsService } from './subcontracts.service';
import {
  sendSuccess,
  sendPaginated,
  sendCreated,
  sendNoContent,
} from '../../shared/utils/response';

export class SubcontractsController {
  // ============================================
  // Subcontrataciones
  // ============================================

  /**
   * POST /projects/:projectId/subcontracts
   * Crear una nueva subcontratacion para un proyecto.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subcontract = await subcontractsService.create(
        { ...req.body, projectId: req.params.projectId },
        req.user!.organizationId
      );
      sendCreated(res, subcontract);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /projects/:projectId/subcontracts
   * Listar subcontrataciones de un proyecto (paginado).
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await subcontractsService.findAll(
        req.params.projectId,
        req.user!.organizationId,
        req.query as any
      );
      sendPaginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /subcontracts/:id
   * Obtener detalle de una subcontratacion con items y certificados.
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subcontract = await subcontractsService.findById(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, subcontract);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /subcontracts/:id
   * Actualizar una subcontratacion (solo DRAFT).
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subcontract = await subcontractsService.update(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendSuccess(res, subcontract);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /subcontracts/:id
   * Eliminar subcontratacion (soft delete, solo DRAFT).
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await subcontractsService.delete(req.params.id, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /subcontracts/:id/activate
   * Activar subcontratacion (DRAFT -> ACTIVE).
   */
  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subcontract = await subcontractsService.activate(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, subcontract);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Items de Subcontratacion
  // ============================================

  /**
   * POST /subcontracts/:id/items
   * Agregar un item a la subcontratacion.
   */
  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await subcontractsService.addItem(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, item);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /subcontracts/:id/items/:itemId
   * Eliminar un item de la subcontratacion (solo DRAFT).
   */
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await subcontractsService.removeItem(
        req.params.id,
        req.params.itemId,
        req.user!.organizationId
      );
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Certificados de Subcontratacion
  // ============================================

  /**
   * POST /subcontracts/:id/certificates
   * Crear un certificado para la subcontratacion.
   */
  async createCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificate = await subcontractsService.createCertificate(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, certificate);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /subcontracts/:id/certificates/:certId/items/:itemId
   * Actualizar el avance de un item de certificado.
   */
  async updateCertificateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await subcontractsService.updateCertificateItem(
        req.params.id,
        req.params.certId,
        req.params.itemId,
        req.body,
        req.user!.organizationId
      );
      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /subcontracts/:id/certificates/:certId/approve
   * Aprobar certificado de subcontratacion (DRAFT -> APPROVED).
   */
  async approveCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificate = await subcontractsService.approveCertificate(
        req.params.id,
        req.params.certId,
        req.user!.id,
        req.user!.organizationId
      );
      sendSuccess(res, certificate);
    } catch (error) {
      next(error);
    }
  }
}

export const subcontractsController = new SubcontractsController();
