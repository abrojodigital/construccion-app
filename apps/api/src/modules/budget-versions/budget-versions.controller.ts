import { Request, Response, NextFunction } from 'express';
import { budgetVersionsService } from './budget-versions.service';
import {
  sendSuccess,
  sendPaginated,
  sendCreated,
  sendNoContent,
} from '../../shared/utils/response';

export class BudgetVersionsController {
  // ============================================
  // Versiones de Presupuesto
  // ============================================

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await budgetVersionsService.findAll(
        req.user!.organizationId,
        req.params.projectId,
        req.query as any
      );
      sendPaginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await budgetVersionsService.findById(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, version);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await budgetVersionsService.create(
        { ...req.body, projectId: req.params.projectId },
        req.user!.organizationId
      );
      sendCreated(res, version);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await budgetVersionsService.update(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendSuccess(res, version);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await budgetVersionsService.delete(req.params.id, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await budgetVersionsService.approve(
        req.params.id,
        req.user!.organizationId,
        req.user!.id
      );
      sendSuccess(res, version);
    } catch (error) {
      next(error);
    }
  }

  async revertToDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const version = await budgetVersionsService.revertToDraft(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, version);
    } catch (error) {
      next(error);
    }
  }

  async recalculate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await budgetVersionsService.recalculateTotals(req.params.id);
      const version = await budgetVersionsService.findById(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, version);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Categorías (Nivel 1)
  // ============================================

  async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await budgetVersionsService.createCategory(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, category);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await budgetVersionsService.updateCategory(
        req.params.categoryId,
        req.body,
        req.user!.organizationId
      );
      sendSuccess(res, category);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await budgetVersionsService.deleteCategory(
        req.params.categoryId,
        req.user!.organizationId
      );
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Etapas (Nivel 2)
  // ============================================

  async createStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stage = await budgetVersionsService.createStage(
        req.params.categoryId,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, stage);
    } catch (error) {
      next(error);
    }
  }

  async updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stage = await budgetVersionsService.updateStage(
        req.params.stageId,
        req.body,
        req.user!.organizationId
      );
      sendSuccess(res, stage);
    } catch (error) {
      next(error);
    }
  }

  async deleteStage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await budgetVersionsService.deleteStage(req.params.stageId, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Ítems (Nivel 3)
  // ============================================

  async createItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await budgetVersionsService.createItem(
        req.params.stageId,
        req.body,
        req.user!.organizationId
      );
      sendCreated(res, item);
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await budgetVersionsService.updateItem(
        req.params.itemId,
        req.body,
        req.user!.organizationId
      );
      sendSuccess(res, item);
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await budgetVersionsService.deleteItem(req.params.itemId, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // Generación de Cronograma
  // ============================================

  async checkSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await budgetVersionsService.checkExistingSchedule(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async generateSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await budgetVersionsService.generateSchedule(
        req.params.id,
        req.user!.organizationId,
        req.body.mode
      );
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const budgetVersionsController = new BudgetVersionsController();
