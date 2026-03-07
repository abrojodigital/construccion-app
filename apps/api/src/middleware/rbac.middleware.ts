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
  | 'budget_versions'
  | 'price_analysis'
  | 'progress'
  | 'certificates'
  | 'subcontracts'
  | 'adjustments'
  | 'currencies'
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
  | 'documents'
  | 'labor_categories'
  | 'equipment_catalog'
  | 'financial_plans';

// Role-based permissions matrix
const rolePermissions: Record<UserRole, Partial<Record<Resource, Permission[]>>> = {
  ADMIN: {
    projects: ['read', 'write', 'delete'],
    stages: ['read', 'write', 'delete'],
    tasks: ['read', 'write', 'delete'],
    budgets: ['read', 'write', 'delete'],
    budget_versions: ['read', 'write', 'delete', 'approve'],
    price_analysis: ['read', 'write', 'delete'],
    progress: ['read', 'write', 'delete'],
    certificates: ['read', 'write', 'delete', 'approve'],
    subcontracts: ['read', 'write', 'delete', 'approve'],
    adjustments: ['read', 'write', 'delete'],
    currencies: ['read', 'write', 'delete'],
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
    labor_categories: ['read', 'write', 'delete'],
    equipment_catalog: ['read', 'write', 'delete'],
    financial_plans: ['read', 'write', 'delete', 'approve'],
  },
  PROJECT_MANAGER: {
    projects: ['read', 'write'],
    stages: ['read', 'write', 'delete'],
    tasks: ['read', 'write', 'delete'],
    budgets: ['read', 'write'],
    budget_versions: ['read', 'write', 'approve'],
    price_analysis: ['read', 'write'],
    progress: ['read', 'write'],
    certificates: ['read', 'write', 'approve'],
    subcontracts: ['read', 'write', 'approve'],
    adjustments: ['read', 'write'],
    currencies: ['read'],
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
    labor_categories: ['read', 'write'],
    equipment_catalog: ['read', 'write'],
    financial_plans: ['read', 'write', 'approve'],
  },
  SUPERVISOR: {
    projects: ['read'],
    stages: ['read'],
    tasks: ['read', 'write'],
    budgets: ['read'],
    budget_versions: ['read', 'write', 'approve'],
    price_analysis: ['read', 'write'],
    progress: ['read', 'write'],
    certificates: ['read', 'write'],
    subcontracts: ['read'],
    adjustments: ['read'],
    currencies: ['read'],
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
    labor_categories: ['read'],
    equipment_catalog: ['read'],
    financial_plans: ['read'],
  },
  ADMINISTRATIVE: {
    projects: ['read'],
    stages: ['read'],
    tasks: ['read'],
    budgets: ['read', 'write'],
    budget_versions: ['read'],
    price_analysis: ['read'],
    progress: ['read'],
    certificates: ['read'],
    subcontracts: ['read'],
    adjustments: ['read'],
    currencies: ['read'],
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
    labor_categories: ['read', 'write'],
    equipment_catalog: ['read', 'write'],
    financial_plans: ['read'],
  },
  READ_ONLY: {
    projects: ['read'],
    stages: ['read'],
    tasks: ['read'],
    budgets: ['read'],
    budget_versions: ['read'],
    price_analysis: ['read'],
    progress: ['read'],
    certificates: ['read'],
    subcontracts: ['read'],
    adjustments: ['read'],
    currencies: ['read'],
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
    labor_categories: ['read'],
    equipment_catalog: ['read'],
    financial_plans: ['read'],
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
    budget_versions: 'versiones de presupuesto',
    price_analysis: 'análisis de precios',
    progress: 'avance físico',
    certificates: 'certificaciones',
    subcontracts: 'subcontrataciones',
    adjustments: 'redeterminaciones',
    currencies: 'monedas',
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
    labor_categories: 'categorías de mano de obra',
    equipment_catalog: 'catálogo de equipos',
    financial_plans: 'planes financieros',
  };
  return labels[resource];
}
