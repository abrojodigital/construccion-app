import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@construccion/database';
import { AppError } from '../shared/utils/errors';
import { sendError } from '../shared/utils/response';
import { config } from '../config';

/**
 * Global error handling middleware
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  // Log error in development
  if (config.isDev) {
    console.error('Error:', error);
  }

  // Handle known AppError types
  if (error instanceof AppError) {
    return sendError(res, error.statusCode, {
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, 400, {
      code: 'VALIDATION_ERROR',
      message: 'Error de validación en la consulta',
    });
  }

  // Handle JWT errors (already caught in auth middleware, but just in case)
  if (error.name === 'TokenExpiredError') {
    return sendError(res, 401, {
      code: 'TOKEN_EXPIRED',
      message: 'Token expirado',
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return sendError(res, 401, {
      code: 'INVALID_TOKEN',
      message: 'Token inválido',
    });
  }

  // Handle syntax errors (malformed JSON)
  if (error instanceof SyntaxError && 'body' in error) {
    return sendError(res, 400, {
      code: 'INVALID_JSON',
      message: 'JSON malformado en el cuerpo de la solicitud',
    });
  }

  // Default to internal server error
  return sendError(res, 500, {
    code: 'INTERNAL_ERROR',
    message: config.isProd
      ? 'Error interno del servidor'
      : error.message || 'Error interno del servidor',
  });
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  res: Response
): Response {
  switch (error.code) {
    // Unique constraint violation
    case 'P2002': {
      const target = (error.meta?.target as string[]) || [];
      const field = target.join(', ');
      return sendError(res, 409, {
        code: 'DUPLICATE_ENTRY',
        message: `Ya existe un registro con este valor de ${field}`,
        details: { field },
      });
    }

    // Foreign key constraint violation
    case 'P2003': {
      const field = error.meta?.field_name as string;
      return sendError(res, 400, {
        code: 'INVALID_REFERENCE',
        message: `Referencia inválida en el campo ${field}`,
        details: { field },
      });
    }

    // Record not found
    case 'P2025':
      return sendError(res, 404, {
        code: 'NOT_FOUND',
        message: 'Registro no encontrado',
      });

    // Required field missing
    case 'P2012': {
      const field = error.meta?.column as string;
      return sendError(res, 400, {
        code: 'REQUIRED_FIELD',
        message: `Campo requerido: ${field}`,
        details: { field },
      });
    }

    // Value too long for column
    case 'P2000': {
      const field = error.meta?.column_name as string;
      return sendError(res, 400, {
        code: 'VALUE_TOO_LONG',
        message: `Valor demasiado largo para el campo ${field}`,
        details: { field },
      });
    }

    // Invalid value for field type
    case 'P2006': {
      const field = error.meta?.column_name as string;
      return sendError(res, 400, {
        code: 'INVALID_VALUE',
        message: `Valor inválido para el campo ${field}`,
        details: { field },
      });
    }

    default:
      return sendError(res, 500, {
        code: 'DATABASE_ERROR',
        message: config.isProd
          ? 'Error en la base de datos'
          : error.message,
      });
  }
}

/**
 * Handle 404 for undefined routes
 */
export function notFoundMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  return sendError(res, 404, {
    code: 'ROUTE_NOT_FOUND',
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
}
