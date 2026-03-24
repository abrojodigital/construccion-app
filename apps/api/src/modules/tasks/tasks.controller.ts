import { Request, Response, NextFunction } from 'express';
import { tasksService } from './tasks.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';

class TasksController {
  async findByStage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.findByStage(
        req.params.stageId,
        req.user!.organizationId
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.findById(req.params.id, req.user!.organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.create(
        req.params.stageId,
        req.body,
        req.user!.organizationId
      );
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.update(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.updateStatus(
        req.params.id,
        req.body.status,
        req.user!.organizationId
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createDependency(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.createDependency(
        req.params.id,
        req.body,
        req.user!.organizationId
      );
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteDependency(req: Request, res: Response, next: NextFunction) {
    try {
      await tasksService.deleteDependency(req.params.dependencyId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, employeeId } = req.body;
      const result = await tasksService.assign(
        req.params.id,
        userId,
        employeeId,
        req.user!.organizationId
      );
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await tasksService.delete(req.params.id, req.user!.organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const tasksController = new TasksController();
