import { Request, Response, NextFunction } from 'express';
import { adjustmentsService } from './adjustments.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

class AdjustmentsController {
  // ============================================
  // ÍNDICES DE PRECIOS
  // ============================================

  async createIndex(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await adjustmentsService.createIndex(req.body, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findAllIndices(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await adjustmentsService.findAllIndices(organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findIndexById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await adjustmentsService.findIndexById(id, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async addIndexValue(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await adjustmentsService.addIndexValue(id, req.body, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteIndex(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      await adjustmentsService.deleteIndex(id, organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // FÓRMULAS DE AJUSTE
  // ============================================

  async createFormula(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await adjustmentsService.createFormula(req.body, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findAllFormulas(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await adjustmentsService.findAllFormulas(organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findFormulaById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await adjustmentsService.findFormulaById(id, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteFormula(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      await adjustmentsService.deleteFormula(id, organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // CÁLCULO
  // ============================================

  async calculateFactor(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await adjustmentsService.calculateFactor(req.body, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const adjustmentsController = new AdjustmentsController();
