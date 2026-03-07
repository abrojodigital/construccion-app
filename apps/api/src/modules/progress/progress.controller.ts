import { Request, Response, NextFunction } from 'express';
import { progressService } from './progress.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

export class ProgressController {
  // ============================================
  // Registrar avance fisico
  // ============================================

  async registerProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const progress = await progressService.registerProgress(
        req.params.budgetItemId,
        req.body,
        req.user!.id,
        req.user!.organizationId
      );
      sendCreated(res, progress);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Historial de avance
  // ============================================

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await progressService.getHistory(
        req.params.budgetItemId,
        req.user!.organizationId
      );
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Eliminar entrada de avance
  // ============================================

  async deleteProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await progressService.deleteProgress(req.params.id, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Resumen de avance por version de presupuesto
  // ============================================

  async getProgressSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await progressService.getProgressSummary(
        req.params.budgetVersionId,
        req.user!.organizationId
      );
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const progressController = new ProgressController();
