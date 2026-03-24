import { Request, Response, NextFunction } from 'express';
import { employeesService } from './employees.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

class EmployeesController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, sortOrder = 'asc', sortBy, search, department, specialty, isActive } = req.query as any;
      const organizationId = req.user!.organizationId;

      const { employees, total, page: p, limit: l } = await employeesService.findAll(organizationId, {
        page,
        limit,
        sortBy,
        sortOrder,
        search,
        department,
        specialty,
        isActive,
      });

      return sendPaginated(res, employees, { page: p, limit: l, total });
    } catch (error) {
      next(error);
    }
  }

  async findAvailable(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.query as { projectId?: string };
      const organizationId = req.user!.organizationId;
      const result = await employeesService.findAvailable(organizationId, projectId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await employeesService.findById(id, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await employeesService.create(req.body, organizationId);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await employeesService.update(id, req.body, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      await employeesService.delete(id, organizationId);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async findAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const { month, year } = req.query as { month?: string; year?: string };
      const result = await employeesService.findAttendance(id, organizationId, { month, year });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await employeesService.createAttendance(id, organizationId, req.body);
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async findProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const organizationId = req.user!.organizationId;
      const result = await employeesService.findProjects(id, organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async bulkAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await employeesService.bulkAttendance(organizationId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async attendanceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const { startDate, endDate, projectId } = req.query as {
        startDate?: string;
        endDate?: string;
        projectId?: string;
      };
      const result = await employeesService.attendanceReport(organizationId, { startDate, endDate, projectId });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const employeesController = new EmployeesController();
