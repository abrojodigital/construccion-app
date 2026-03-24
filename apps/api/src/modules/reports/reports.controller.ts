import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../shared/utils/response';
import { reportsService } from './reports.service';

export class ReportsController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { period, projectId } = req.query as { period?: string; projectId?: string };

      const data = await reportsService.getDashboard(organizationId, { period, projectId });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getProjectCosts(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const organizationId = req.user!.organizationId;

      const data = await reportsService.getProjectCosts(projectId, organizationId);
      if (!data) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getProjectProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const organizationId = req.user!.organizationId;

      const data = await reportsService.getProjectProgress(projectId, organizationId);
      if (!data) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, groupBy } = req.query as {
        startDate?: string;
        endDate?: string;
        groupBy?: 'category' | 'project' | 'supplier';
      };
      const organizationId = req.user!.organizationId;

      const data = await reportsService.getExpenses(organizationId, { startDate, endDate, groupBy });
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getProjectBudgetControl(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const organizationId = req.user!.organizationId;

      const data = await reportsService.getProjectBudgetControl(projectId, organizationId);
      if (!data) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { period, projectId } = req.body as { period?: string; projectId?: string };

      const { html, filename } = await reportsService.exportPdf(organizationId, { period, projectId });
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(html);
    } catch (error) {
      next(error);
    }
  }

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { period, projectId } = req.body as { period?: string; projectId?: string };

      const { csv, filename } = await reportsService.exportExcel(organizationId, { period, projectId });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
