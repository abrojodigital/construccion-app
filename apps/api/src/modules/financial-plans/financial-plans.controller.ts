import { Request, Response, NextFunction } from 'express';
import { financialPlansService } from './financial-plans.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

class FinancialPlansController {
  // ============================================
  // PLANES FINANCIEROS
  // ============================================

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await financialPlansService.create(req.body, projectId, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { projectId } = req.params;
      const result = await financialPlansService.findAll(organizationId, projectId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await financialPlansService.findById(id, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await financialPlansService.update(id, req.body, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      await financialPlansService.delete(id, organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await financialPlansService.approve(id, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PERÍODOS FINANCIEROS
  // ============================================

  async addPeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await financialPlansService.addPeriod(id, req.body, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updatePeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { periodId } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await financialPlansService.updatePeriod(
        periodId,
        req.body,
        organizationId
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deletePeriod(req: Request, res: Response, next: NextFunction) {
    try {
      const { periodId } = req.params;
      const organizationId = req.user!.organizationId;
      await financialPlansService.deletePeriod(periodId, organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const financialPlansController = new FinancialPlansController();
