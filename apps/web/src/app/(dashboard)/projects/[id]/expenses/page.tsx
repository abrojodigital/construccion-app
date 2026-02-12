'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EXPENSE_STATUS_LABELS } from '@construccion/shared';

interface Expense {
  id: string;
  description: string;
  amount: string;
  taxAmount: string;
  totalAmount: string;
  expenseDate: string;
  status: string;
  invoiceNumber: string | null;
  category: { name: string };
  supplier: { name: string } | null;
  createdBy: { firstName: string; lastName: string };
}

interface ExpensesResponse {
  data: Expense[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

interface ProjectSummary {
  code: string;
  name: string;
  estimatedBudget: string;
  currentSpent: string;
}

export default function ProjectExpensesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: project } = useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: () => api.get<ProjectSummary>(`/projects/${projectId}`),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['project-expenses', projectId, page, search, statusFilter],
    queryFn: () =>
      api.get<ExpensesResponse>('/expenses', {
        params: {
          projectId,
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        },
      }),
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'destructive';
      case 'PAID':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const budgetUsed = project
    ? Math.round((Number(project.currentSpent) / Number(project.estimatedBudget)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{project?.code}</Badge>
            </div>
            <h1 className="text-3xl font-bold">Gastos del Proyecto</h1>
            <p className="text-muted-foreground">{project?.name}</p>
          </div>
        </div>
        <Link href={`/expenses/new?projectId=${projectId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(project?.estimatedBudget || 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gastado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(project?.currentSpent || 0))}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className={`h-full transition-all ${budgetUsed > 100 ? 'bg-red-500' : budgetUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{budgetUsed}% utilizado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${Number(project?.estimatedBudget || 0) - Number(project?.currentSpent || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Number(project?.estimatedBudget || 0) - Number(project?.currentSpent || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar gastos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(EXPENSE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <p className="text-muted-foreground">No hay gastos registrados</p>
                    <Link href={`/expenses/new?projectId=${projectId}`}>
                      <Button variant="link">Registrar primer gasto</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((expense) => (
                  <TableRow key={expense.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{expense.description}</p>
                        {expense.invoiceNumber && (
                          <p className="text-xs text-muted-foreground">
                            Factura: {expense.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category.name}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expense.supplier?.name || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(expense.totalAmount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(expense.status)}>
                        {EXPENSE_STATUS_LABELS[expense.status as keyof typeof EXPENSE_STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
