import { Request, Response, NextFunction } from 'express';
import { projectsService } from './projects.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../shared/utils/response';

export class ProjectsController {
  /**
   * GET /api/v1/projects
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await projectsService.findAll(req.user!.organizationId, req.query as any);
      sendPaginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/projects/:id
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectsService.findById(req.params.id, req.user!.organizationId);
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/projects
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectsService.create(req.body, req.user!.organizationId);
      sendCreated(res, project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/projects/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectsService.update(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      sendSuccess(res, project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/projects/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await projectsService.delete(req.params.id, req.user!.organizationId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/projects/:id/summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await projectsService.getSummary(req.params.id, req.user!.organizationId);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/projects/:id/gantt
   */
  async getGanttData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ganttData = await projectsService.getGanttData(req.params.id, req.user!.organizationId);
      sendSuccess(res, ganttData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/projects/:id/budget-status
   */
  async getBudgetStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const budgetStatus = await projectsService.getBudgetStatus(
        req.params.id,
        req.user!.organizationId
      );
      sendSuccess(res, budgetStatus);
    } catch (error) {
      next(error);
    }
  }
}

export const projectsController = new ProjectsController();
