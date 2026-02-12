// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User Types
export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'SUPERVISOR' | 'ADMINISTRATIVE' | 'READ_ONLY';

export interface UserPayload {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string;
  iat: number;
  exp: number;
}

// Project Types
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  estimatedBudget: number;
  currentSpent: number;
  budgetPercentage: number;
  startDate: string | null;
  estimatedEndDate: string | null;
  managerName: string;
}

// Task Types
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface GanttTask {
  id: string;
  name: string;
  start: string | null;
  end: string | null;
  progress: number;
  status: TaskStatus;
  stageId: string;
  stageName: string;
  dependencies: GanttDependency[];
  assignees: GanttAssignee[];
}

export interface GanttDependency {
  id: string;
  type: DependencyType;
  lag: number;
}

export interface GanttAssignee {
  id: string;
  firstName: string;
  lastName: string;
}

export interface GanttData {
  project: {
    id: string;
    name: string;
    startDate: string | null;
    estimatedEndDate: string | null;
  };
  tasks: GanttTask[];
}

// Expense Types
export type ExpenseStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: Record<string, number>;
  byStatus: Record<ExpenseStatus, number>;
  monthlyTrend: { month: string; amount: number }[];
}

// Budget Types
export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  byCategory: {
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentage: number;
  }[];
}

// Purchase Order Types
export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIAL_DELIVERY' | 'COMPLETED' | 'CANCELLED';

// Quote Types
export type QuoteStatus = 'REQUESTED' | 'RECEIVED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

// Attendance Types
export type AttendanceType = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'VACATION' | 'SICK_LEAVE';

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalHours: number;
  overtimeHours: number;
}

// Notification Types
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_OVERDUE'
  | 'EXPENSE_APPROVAL'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'BUDGET_ALERT'
  | 'STOCK_LOW'
  | 'PROJECT_UPDATE'
  | 'GENERAL';

// Dashboard Types
export interface DashboardKPIs {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  overdueTasksCount: number;
  pendingApprovalsCount: number;
  lowStockMaterialsCount: number;
}

export interface DashboardProjectCard {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  budgetPercentage: number;
  daysRemaining: number | null;
  tasksCompleted: number;
  totalTasks: number;
}

// Report Types
export interface CostReport {
  projectId: string;
  projectName: string;
  period: { start: string; end: string };
  budgetedCost: number;
  actualCost: number;
  variance: number;
  variancePercentage: number;
  costByCategory: {
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[];
  monthlyBreakdown: {
    month: string;
    budgeted: number;
    actual: number;
  }[];
}

export interface ProgressReport {
  projectId: string;
  projectName: string;
  overallProgress: number;
  stages: {
    id: string;
    name: string;
    progress: number;
    plannedStart: string | null;
    plannedEnd: string | null;
    actualStart: string | null;
    actualEnd: string | null;
    status: 'on_track' | 'delayed' | 'ahead' | 'completed';
  }[];
}

// Filter Types
export interface ProjectFilters extends PaginationParams {
  status?: ProjectStatus;
  managerId?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export interface ExpenseFilters extends PaginationParams {
  projectId?: string;
  categoryId?: string;
  status?: ExpenseStatus;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface EmployeeFilters extends PaginationParams {
  department?: string;
  specialty?: string;
  isActive?: boolean;
  search?: string;
}
