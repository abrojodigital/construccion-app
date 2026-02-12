/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.details = details;
    this.name = 'AppError';

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} con id ${id} no encontrado`
      : `${resource} no encontrado`;
    super(404, message, 'NOT_FOUND');
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  constructor(details: Record<string, unknown> | string) {
    const message = typeof details === 'string' ? details : 'Error de validación';
    super(
      400,
      message,
      'VALIDATION_ERROR',
      typeof details === 'object' ? details : undefined
    );
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(401, message, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(403, message, 'FORBIDDEN');
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto con el estado actual') {
    super(409, message, 'CONFLICT');
  }
}

/**
 * Too Many Requests Error (429)
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Demasiadas solicitudes') {
    super(429, message, 'TOO_MANY_REQUESTS');
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Error interno del servidor') {
    super(500, message, 'INTERNAL_ERROR');
  }
}
