import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../shared/utils/errors';

/**
 * Middleware factory for request body validation using Zod schemas
 */
export function validateBody(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = formatZodErrors(error);
        next(new ValidationError(details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Middleware factory for query params validation using Zod schemas
 */
export function validateQuery(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query);
      req.query = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = formatZodErrors(error);
        next(new ValidationError(details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Middleware factory for URL params validation using Zod schemas
 */
export function validateParams(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.params);
      req.params = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = formatZodErrors(error);
        next(new ValidationError(details));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Format Zod errors into a readable object
 */
function formatZodErrors(error: ZodError): Record<string, unknown> {
  return {
    errors: error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    })),
  };
}

/**
 * Helper to validate a single ID parameter
 */
export function validateId(req: Request, _res: Response, next: NextFunction): void {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return next(new ValidationError({ id: 'ID inválido' }));
  }

  next();
}

/**
 * Sanitize and trim string fields in request body
 */
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Recursively sanitize object values
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Trim strings and convert empty strings to undefined
      const trimmed = value.trim();
      sanitized[key] = trimmed === '' ? undefined : trimmed;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
