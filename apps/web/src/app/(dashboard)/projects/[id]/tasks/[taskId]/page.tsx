'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  EXPENSE_STATUS_LABELS,
} from '@construccion/shared';

interface TaskDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  progress: number;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  stage: {
    id: string;
    name: string;
    projectId: string;
    project: { id: string; code: string; name: string };
  };
  assignments: Array<{
    id: string;
    user: { id: string; firstName: string; lastName: string } | null;
    employee: { id: string; firstName: string; lastName: string } | null;
  }>;
}

interface Expense {
  id: string;
  reference: string;
  description: string;
  totalAmount: string;
  status: string;
  expenseDate: string;
  category: { name: string; color: string };
}

export default function TaskDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const taskId = params.taskId as string;

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => api.get<TaskDetail>(`/tasks/${taskId}`),
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['task-expenses', taskId],
    queryFn: () =>
      api.get<{ data: Expense[] }>('/expenses', {
        params: { taskId, limit: 100 },
      }),
  });

  const expenses = expensesData?.data || [];
  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + Number(exp.totalAmount),
    0
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'BLOCKED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'default';
      case 'BLOCKED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getExpenseStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return 'success';
      case 'PENDING_APPROVAL':
        return 'warning';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (taskLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded"></div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">Tarea no encontrada</h2>
        <Link href={`/projects/${projectId}/stages`}>
          <Button variant="link">Volver a etapas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/stages`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{task.stage.project.code}</Badge>
              <span className="text-muted-foreground">/</span>
              <Badge variant="outline">{task.stage.name}</Badge>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(task.status)}
              <h1 className="text-3xl font-bold">{task.name}</h1>
            </div>
            {task.description && (
              <p className="text-muted-foreground mt-2">{task.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(task.status) as any}>
            {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
          </Badge>
          <Badge variant={getPriorityVariant(task.priority) as any}>
            {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progreso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{task.progress}%</div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {task.actualHours || 0}h
              {task.estimatedHours && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/ {task.estimatedHours}h
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {task.estimatedHours
                ? `${Math.round(((task.actualHours || 0) / task.estimatedHours) * 100)}% del estimado`
                : 'Sin estimacion'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, { compact: true })}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} gastos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fechas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {task.plannedStartDate && (
                <p>
                  <span className="text-muted-foreground">Inicio:</span>{' '}
                  {formatDate(task.actualStartDate || task.plannedStartDate)}
                </p>
              )}
              {task.plannedEndDate && (
                <p>
                  <span className="text-muted-foreground">Fin:</span>{' '}
                  {formatDate(task.actualEndDate || task.plannedEndDate)}
                </p>
              )}
              {!task.plannedStartDate && !task.plannedEndDate && (
                <span className="text-muted-foreground">Sin fechas definidas</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned People */}
      {task.assignments && task.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Asignados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {task.assignments.map((assignment) => {
                const person = assignment.user || assignment.employee;
                if (!person) return null;
                return (
                  <Badge key={assignment.id} variant="outline" className="text-sm py-1 px-3">
                    {person.firstName} {person.lastName}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gastos Asociados
          </CardTitle>
          <Link href={`/expenses/new?projectId=${projectId}&taskId=${taskId}`}>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Gasto
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {expensesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-muted rounded"></div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground mt-2">
                No hay gastos asociados a esta tarea
              </p>
              <Link href={`/expenses/new?projectId=${projectId}&taskId=${taskId}`}>
                <Button variant="outline" size="sm" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar primer gasto
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: expense.category.color }}
                    />
                    <div>
                      <Link
                        href={`/expenses/${expense.id}`}
                        className="font-medium hover:underline"
                      >
                        {expense.reference}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {expense.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(Number(expense.totalAmount))}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(expense.expenseDate)}
                      </p>
                    </div>
                    <Badge variant={getExpenseStatusVariant(expense.status) as any}>
                      {EXPENSE_STATUS_LABELS[expense.status as keyof typeof EXPENSE_STATUS_LABELS]}
                    </Badge>
                    <Link href={`/expenses/${expense.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              <Separator className="my-4" />

              <div className="flex justify-between items-center px-3">
                <span className="font-medium">Total de Gastos</span>
                <span className="text-xl font-bold">{formatCurrency(totalExpenses, { compact: true })}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
