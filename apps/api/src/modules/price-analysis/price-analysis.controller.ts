import { Request, Response, NextFunction } from 'express';
import { priceAnalysisService } from './price-analysis.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

export class PriceAnalysisController {
  // ============================================
  // Consulta
  // ============================================

  async findByBudgetItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pa = await priceAnalysisService.findByBudgetItem(
        req.params.budgetItemId,
        req.user!.organizationId
      );
      sendSuccess(res, pa);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Crear / Eliminar análisis
  // ============================================

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pa = await priceAnalysisService.create(
        req.params.budgetItemId,
        req.user!.organizationId
      );
      sendCreated(res, pa);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await priceAnalysisService.delete(req.params.id, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Sub-ítems: Materiales
  // ============================================

  async addMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const material = await priceAnalysisService.addMaterial(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, material);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Sub-ítems: Mano de Obra
  // ============================================

  async addLabor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const labor = await priceAnalysisService.addLabor(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, labor);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Sub-ítems: Equipos
  // ============================================

  async addEquipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const equipment = await priceAnalysisService.addEquipment(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, equipment);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Sub-ítems: Transporte
  // ============================================

  async addTransport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const transport = await priceAnalysisService.addTransport(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, transport);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Recalcular totales
  // ============================================

  async recalculate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await priceAnalysisService.recalculateTotals(req.params.id);
      sendSuccess(res, { recalculated: true });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Eliminar sub-ítem genérico
  // ============================================

  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await priceAnalysisService.removeItem(
        req.params.type,
        req.params.itemId,
        req.params.id,
        req.user!.organizationId
      );
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const priceAnalysisController = new PriceAnalysisController();
