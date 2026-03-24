import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../shared/utils/response';

const ALLOWED_SORT_FIELDS = ['firstName', 'lastName', 'email', 'role', 'createdAt', 'updatedAt'];

class UsersController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, sortOrder = 'asc' } = req.query as any;
      const search = req.query.search as string | undefined;
      const sortBy = ALLOWED_SORT_FIELDS.includes(req.query.sortBy as string)
        ? (req.query.sortBy as string)
        : 'lastName';
      const safeSortOrder = sortOrder === 'desc' ? 'desc' : ('asc' as const);

      const { users, total } = await usersService.findAll(req.user!.organizationId, {
        page: Number(page),
        limit: Number(limit),
        sortBy,
        sortOrder: safeSortOrder,
        search,
      });

      return sendPaginated(res, users, { page: Number(page), limit: Number(limit), total });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.findById(req.params.id, req.user!.organizationId);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.create(
        req.body,
        req.user!.organizationId,
        req.user!.role
      );
      return sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.update(
        req.params.id,
        req.body,
        req.user!.organizationId,
        req.user!.role
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async patch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.patch(
        req.params.id,
        req.body,
        req.user!.organizationId,
        req.user!.role,
        req.user!.id
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.delete(
        req.params.id,
        req.user!.organizationId,
        req.user!.role,
        req.user!.id
      );
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
