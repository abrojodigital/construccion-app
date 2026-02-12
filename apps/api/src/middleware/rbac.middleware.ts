import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../shared/utils/errors';
import type { UserRole } from '@construccion/shared';

// Permission types
type Permission = 'read' | 'write' | 'delete' | 'approve';

// Resource types
type Resource =
  | 'projects'
  | 'stages'
  | 'tasks'
  | 'budgets'
  | 'expenses'
  | 'purchase_orders'
  | 'suppliers'
  | 'materials'
  | 'employees'
  | 'attendance'
  | 'quotes'
  | 'reports'
  | 'users'
  | 'notifications'
  | 'documents';

// Role-based permissions matrix
const rolePermissions: Record<UserRole, Partial<Record<Resource, Permission[]>>> = {
  ADMIN: {
    projects: ['read', 'write', 'delete'],
    stages: ['read', 'write', 'delete'],
    tasks: ['read', 'write', 'delete'],
    budgets: ['read', 'write', 'delete'],
    expenses: ['read', 'write', 'delete', 'approve'],
    purchase_orders: ['read', 'write', 'delete'],
    suppliers: ['read', 'write', 'delete'],
    materials: ['read', 'write', 'delete'],
    employees: ['read', 'write', 'delete'],
    attendance: ['read', 'write', 'delete'],
    quotes: ['read', 'write', 'delete'],
    reports: ['read'],
    users: ['read', 'write', 'delete'],
    notifications: ['read', 'write'],
    documents: ['read', 'write', 'delete'],
  },
  PROJECT_MANAGER: {
    projects: ['read', 'write'],
    stages: ['read', 'write', 'delete'],
    tasks: ['read', 'write', 'delete'],
    budgets: ['read', 'write'],
    expenses: ['read', 'write', 'approve'],
    purchase_orders: ['read', 'write'],
    suppliers: ['read', 'write'],
    materials: ['read', 'write'],
    employees: ['read', 'write'],
    attendance: ['read', 'write'],
    quotes: ['read', 'write'],
    reports: ['read'],
    notifications: ['read', 'write'],
    documents: ['read', 'write', 'delete'],
  },
  SUPERVISOR: {
    projects: ['read'],
    stages: ['read'],
    tasks: ['read', 'write'],
    budgets: ['read'],
    expenses: ['read', 'write'],
    purchase_orders: ['read'],
    suppliers: ['read'],
    materials: ['read'],
    employees: ['read'],
    attendance: ['read', 'write'],
    quotes: ['read'],
    reports: ['read'],
    notifications: ['read'],
    documents: ['read', 'write'],
  },
  ADMINISTRATIVE: {
    projects: ['read'],
    stages: ['read'],
    tasks: ['read'],
    budgets: ['read', 'write'],
    expenses: ['read', 'write'],
    purchase_orders: ['read', 'write'],
    suppliers: ['read', 'write'],
    materials: ['read', 'write'],
    employees: ['read', 'write'],
    attendance: ['read', 'write'],
    quotes: ['read', 'write'],
    reports: ['read'],
    notifications: ['read'],
    documents: ['read', 'write'],
  },
  READ_ONLY: {
    projects: ['read'],
    stages: ['read'],
    tasks: ['read'],
    budgets: ['read'],
    expenses: ['read'],
    purchase_orders: ['read'],
    suppliers: ['read'],
    materials: ['read'],
    employees: ['read'],
    attendance: ['read'],
    quotes: ['read'],
    reports: ['read'],
    notifications: ['read'],
    documents: ['read'],
  },
};

/**
 * Check if a role has a specific permission on a resource
 */
export function hasPermission(
  role: UserRole,
  resource: Resource,
  permission: Permission
): boolean {
  const permissions = rolePermissions[role]?.[resource] || [];
  return permissions.includes(permission);
}

/**
 * Middleware factory to require specific permissions
 */
export function requirePermission(resource: Resource, permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('No autenticado'));
    }

    const userRole = req.user.role as UserRole;

    if (!hasPermission(userRole, resource, permission)) {
      return next(
        new ForbiddenError(
          `No tiene permisos para ${getPermissionLabel(permission)} ${getResourceLabel(resource)}`
        )
      );
    }

    next();
  };
}

/**
 * Middleware factory to require any of multiple permissions
 */
export function requireAnyPermission(
  resource: Resource,
  permissions: Permission[]
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('No autenticado'));
    }

    const userRole = req.user.role as UserRole;
    const hasAny = permissions.some((p) => hasPermission(userRole, resource, p));

    if (!hasAny) {
      return next(
        new ForbiddenError(
          `No tiene permisos suficientes para ${getResourceLabel(resource)}`
        )
      );
    }

    next();
  };
}

/**
 * Middleware to require specific roles
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('No autenticado'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Se requiere uno de los siguientes roles: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError('No autenticado'));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Se requiere rol de Administrador'));
  }

  next();
}

// Helper functions for Spanish labels
function getPermissionLabel(permission: Permission): string {
  const labels: Record<Permission, string> = {
    read: 'ver',
    write: 'modificar',
    delete: 'eliminar',
    approve: 'aprobar',
  };
  return labels[permission];
}

function getResourceLabel(resource: Resource): string {
  const labels: Record<Resource, string> = {
    projects: 'proyectos',
    stages: 'etapas',
    tasks: 'tareas',
    budgets: 'presupuestos',
    expenses: 'gastos',
    purchase_orders: 'órdenes de compra',
    suppliers: 'proveedores',
    materials: 'materiales',
    employees: 'empleados',
    attendance: 'asistencia',
    quotes: 'cotizaciones',
    reports: 'reportes',
    users: 'usuarios',
    notifications: 'notificaciones',
    documents: 'documentos',
  };
  return labels[resource];
}
