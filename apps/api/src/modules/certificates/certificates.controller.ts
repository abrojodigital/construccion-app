import { Request, Response, NextFunction } from 'express';
import { certificatesService } from './certificates.service';
import {
  sendSuccess,
  sendPaginated,
  sendCreated,
  sendNoContent,
} from '../../shared/utils/response';

export class CertificatesController {
  // ============================================
  // Certificaciones
  // ============================================

  /**
   * POST /projects/:projectId/certificates
   * Crear un nuevo certificado para un proyecto.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificate = await certificatesService.create(
        req.params.projectId,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, certificate);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /projects/:projectId/certificates
   * Listar certificados de un proyecto (paginado).
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await certificatesService.findAll(
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
   * GET /certificates/:id
   * Obtener detalle de un certificado con todos sus items.
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificate = await certificatesService.findById(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, certificate);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /certificates/:id/items/:itemId
   * Actualizar el avance de un item de certificacion.
   */
  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await certificatesService.updateItem(
        req.params.id,
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
   * POST /certificates/:id/submit
   * Presentar certificado para aprobacion.
   */
  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificate = await certificatesService.submit(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, certificate);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /certificates/:id/approve
   * Aprobar certificado (requiere permiso 'approve').
   */
  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificate = await certificatesService.approve(
        req.params.id,
        req.user!.id,
        req.user!.organizationId
      );
      sendSuccess(res, certificate);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /certificates/:id/mark-paid
   * Marcar certificado aprobado como pagado.
   */
  async markAsPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificate = await certificatesService.markAsPaid(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, certificate);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /certificates/:id/export/pdf
   * Exportar certificado como HTML para imprimir como PDF.
   */
  async exportPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const html = await certificatesService.exportHtml(
        req.params.id,
        req.user!.organizationId
      );
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /certificates/:id/export/excel
   * Exportar certificado como CSV compatible con Excel.
   */
  async exportExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cert = await certificatesService.findById(req.params.id, req.user!.organizationId);
      const csv = await certificatesService.exportCsv(req.params.id, req.user!.organizationId);
      const bom = '\uFEFF';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=certificado-${cert.code}.csv`
      );
      res.send(bom + csv);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /certificates/:id
   * Eliminar certificado (solo DRAFT, soft delete).
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await certificatesService.delete(
        req.params.id,
        req.user!.organizationId
      );
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const certificatesController = new CertificatesController();
