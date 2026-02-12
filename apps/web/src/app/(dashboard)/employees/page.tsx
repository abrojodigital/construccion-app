'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, MoreHorizontal, Eye, Edit, Users, Calendar, Briefcase, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/tables/data-table';
import { api } from '@/lib/api';
import { formatDate, getInitials, formatCurrency } from '@/lib/utils';
import { EMPLOYMENT_TYPES } from '@construccion/shared';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

interface Employee {
  id: string;
  legajo: string;
  firstName: string;
  lastName: string;
  dni: string;
  cuil: string;
  email: string | null;
  phone: string | null;
  position: string;
  specialty: string | null;
  employmentType: string;
  hireDate: string;
  isActive: boolean;
  hourlyRate: string | null;
  _count: {
    projectAssignments: number;
  };
}

interface EmployeesResponse {
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search],
    queryFn: () =>
      api.get<EmployeesResponse>('/employees', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
        },
      }),
  });

  const getEmploymentTypeLabel = (type: string) => {
    const found = EMPLOYMENT_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Empleado eliminado correctamente');
      setEmployeeToDelete(null);
    },
    onError: () => {
      toast.error('Error al eliminar el empleado');
    },
  });

  const columns = [
    {
      accessorKey: 'employee',
      header: 'Empleado',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {getInitials(row.original.firstName, row.original.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/employees/${row.original.id}`}
              className="font-medium hover:underline text-primary"
            >
              {row.original.firstName} {row.original.lastName}
            </Link>
            <div className="text-xs text-muted-foreground">Legajo: {row.original.legajo}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'position',
      header: 'Puesto',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.position}</div>
          {row.original.specialty && (
            <div className="text-xs text-muted-foreground">{row.original.specialty}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'dni',
      header: 'DNI',
      cell: ({ row }: any) => row.original.dni,
    },
    {
      accessorKey: 'contact',
      header: 'Contacto',
      cell: ({ row }: any) => (
        <div className="text-sm">
          {row.original.phone && <div>{row.original.phone}</div>}
          {row.original.email && (
            <div className="text-muted-foreground truncate max-w-[150px]">{row.original.email}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'employmentType',
      header: 'Tipo',
      cell: ({ row }: any) => (
        <Badge variant="outline">{getEmploymentTypeLabel(row.original.employmentType)}</Badge>
      ),
    },
    {
      accessorKey: 'hireDate',
      header: 'Ingreso',
      cell: ({ row }: any) => formatDate(row.original.hireDate),
    },
    {
      accessorKey: 'projects',
      header: 'Proyectos',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span>{row.original._count.projectAssignments}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => (
        <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
          {row.original.isActive ? 'Activo' : 'Inactivo'}
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
              <Link href={`/employees/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/employees/${row.original.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/employees/${row.original.id}/attendance`}>
                <Calendar className="mr-2 h-4 w-4" />
                Asistencia
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setEmployeeToDelete(row.original)}
                >
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
          <h1 className="text-3xl font-bold">Empleados</h1>
          <p className="text-muted-foreground">Gestion del personal de la empresa</p>
        </div>
        <div className="flex gap-2">
          <Link href="/employees/attendance">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Asistencia
            </Button>
          </Link>
          <Link href="/employees/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Empleado
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, legajo, DNI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{data?.pagination.total || 0}</div>
              <div className="text-sm text-muted-foreground">Total empleados</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {data?.data.filter((e) => e.isActive).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Activos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {data?.data.filter((e) => e.employmentType === 'PERMANENT').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Permanentes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {data?.data.filter((e) => e.employmentType === 'CONTRACTOR').length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Contratistas</div>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!employeeToDelete} onOpenChange={() => setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al empleado{' '}
              <strong>
                {employeeToDelete?.firstName} {employeeToDelete?.lastName}
              </strong>{' '}
              (Legajo: {employeeToDelete?.legajo}). El empleado no aparecerá en las listas pero sus
              registros históricos se mantendrán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => employeeToDelete && deleteMutation.mutate(employeeToDelete.id)}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
