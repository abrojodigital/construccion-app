import { Response } from 'express';
import type { ApiResponse, ApiError, PaginatedResponse } from '@construccion/shared';

/**
 * Send a success response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
): Response {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return res.status(200).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  statusCode: number,
  error: ApiError
): Response {
  const response: ApiResponse<null> = {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return res.status(statusCode).json(response);
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(res: Response, data: T): Response {
  return sendSuccess(res, data, 201);
}

/**
 * Send a no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
