'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/tables/data-table';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EXPENSE_STATUS, EXPENSE_STATUS_LABELS } from '@construccion/shared';

interface Expense {
  id: string;
  reference: string;
  description: string;
  totalAmount: string;
  status: string;
  expenseDate: string;
  project: { id: string; code: string; name: string };
  task: { id: string; name: string; stage: { name: string } } | null;
  category: { id: string; name: string; color: string };
  supplier: { id: string; name: string } | null;
  createdBy: { firstName: string; lastName: string };
}

interface Project {
  id: string;
  code: string;
  name: string;
}

interface Task {
  id: string;
  name: string;
  stage: { name: string };
}

interface ExpensesResponse {
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [taskFilter, setTaskFilter] = useState<string>('all');

  // Fetch projects for filter
  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => api.get<{ data: Project[] }>('/projects?limit=100'),
  });

  // Fetch tasks for selected project
  const { data: tasksData } = useQuery({
    queryKey: ['project-tasks', projectFilter],
    queryFn: () => api.get<any[]>(`/projects/${projectFilter}/stages`),
    enabled: projectFilter !== 'all',
  });

  // Flatten tasks from stages
  const availableTasks: Task[] = tasksData
    ? tasksData.flatMap((stage: any) =>
        (stage.tasks || []).map((task: any) => ({
          id: task.id,
          name: task.name,
          stage: { name: stage.name },
        }))
      )
    : [];

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, search, statusFilter, projectFilter, taskFilter],
    queryFn: () =>
      api.get<ExpensesResponse>('/expenses', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          projectId: projectFilter !== 'all' ? projectFilter : undefined,
          taskId: taskFilter !== 'all' ? taskFilter : undefined,
        },
      }),
  });

  // Reset task filter when project changes
  const handleProjectChange = (value: string) => {
    setProjectFilter(value);
    setTaskFilter('all');
  };

  const getStatusVariant = (status: string) => {
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

  const columns = [
    {
      accessorKey: 'reference',
      header: 'Referencia',
      cell: ({ row }: any) => (
        <Link
          href={`/expenses/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.reference}
        </Link>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Descripcion',
      cell: ({ row }: any) => (
        <div className="max-w-[300px] truncate">{row.original.description}</div>
      ),
    },
    {
      accessorKey: 'project',
      header: 'Proyecto',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.project.code}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
            {row.original.project.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'task',
      header: 'Tarea',
      cell: ({ row }: any) =>
        row.original.task ? (
          <div>
            <div className="font-medium truncate max-w-[120px]">{row.original.task.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.task.stage?.name}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }: any) => (
        <Badge
          variant="outline"
          style={{
            borderColor: row.original.category.color,
            color: row.original.category.color,
          }}
        >
          {row.original.category.name}
        </Badge>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Monto',
      cell: ({ row }: any) => (
        <div className="font-medium">{formatCurrency(Number(row.original.totalAmount), { compact: true })}</div>
      ),
    },
    {
      accessorKey: 'expenseDate',
      header: 'Fecha',
      cell: ({ row }: any) => formatDate(row.original.expenseDate),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {EXPENSE_STATUS_LABELS[row.original.status as keyof typeof EXPENSE_STATUS_LABELS]}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/expenses/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </Link>
            </DropdownMenuItem>
            {!['APPROVED', 'PAID'].includes(row.original.status) && (
              <DropdownMenuItem asChild>
                <Link href={`/expenses/${row.original.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
            )}
            {row.original.status === 'PENDING_APPROVAL' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprobar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </DropdownMenuItem>
              </>
            )}
            {row.original.status === 'DRAFT' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gastos</h1>
          <p className="text-muted-foreground">Gestion de gastos de todos los proyectos</p>
        </div>
        <Link href="/expenses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por referencia, descripcion..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
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
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={projectFilter} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Filtrar por proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {projectsData?.data.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.code} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={taskFilter}
                onValueChange={setTaskFilter}
                disabled={projectFilter === 'all'}
              >
                <SelectTrigger className="w-full sm:w-[250px]">
                  <SelectValue placeholder="Filtrar por tarea" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tareas</SelectItem>
                  {availableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.stage.name} &gt; {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(projectFilter !== 'all' || taskFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setProjectFilter('all');
                    setTaskFilter('all');
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.data || []}
            isLoading={isLoading}
            pageCount={data?.pagination.totalPages}
            onPaginationChange={(newPage) => setPage(newPage)}
            currentPage={page}
          />
        </CardContent>
      </Card>
    </div>
  );
}
