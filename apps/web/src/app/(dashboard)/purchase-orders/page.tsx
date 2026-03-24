'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  MoreHorizontal,
  ShoppingCart,
  Send,
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
import { toast } from 'sonner';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  project: { id: string; code: string; name: string };
  supplier: { id: string; name: string };
  createdBy: { firstName: string; lastName: string };
}

interface PurchaseOrdersResponse {
  data: PurchaseOrder[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  CONFIRMED: 'Confirmada',
  PARTIAL_DELIVERY: 'Entrega Parcial',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

function getStatusVariant(status: string) {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'CONFIRMED':
    case 'PARTIAL_DELIVERY': return 'warning';
    case 'CANCELLED': return 'destructive';
    case 'SENT': return 'secondary';
    default: return 'outline';
  }
}

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, search, statusFilter],
    queryFn: () =>
      api.get<PurchaseOrdersResponse>('/purchase-orders', {
        params: {
          page,
          limit: 20,
          ...(search && { search }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
        },
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/purchase-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Orden de compra eliminada');
    },
    onError: () => toast.error('No se puede eliminar esta orden de compra'),
  });

  const orders = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;

  const columns = [
    {
      accessorKey: 'orderNumber',
      header: 'Numero',
      cell: ({ row }: any) => (
        <Link href={`/purchase-orders/${row.original.id}`} className="font-mono text-sm text-primary hover:underline">
          {row.original.orderNumber}
        </Link>
      ),
    },
    {
      accessorKey: 'project.name',
      header: 'Proyecto',
      cell: ({ row }: any) => (
        <span className="text-sm">{row.original.project.name}</span>
      ),
    },
    {
      accessorKey: 'supplier.name',
      header: 'Proveedor',
      cell: ({ row }: any) => (
        <span className="text-sm">{row.original.supplier.name}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => (
        <Badge variant={getStatusVariant(row.original.status)}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }: any) => (
        <span className="font-medium">{formatCurrency(Number(row.original.totalAmount))}</span>
      ),
    },
    {
      accessorKey: 'orderDate',
      header: 'Fecha',
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.orderDate)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/purchase-orders/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </Link>
            </DropdownMenuItem>
            {row.original.status === 'DRAFT' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => deleteMutation.mutate(row.original.id)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ordenes de Compra</h1>
          <p className="text-muted-foreground">Gestion de ordenes de compra a proveedores</p>
        </div>
        <Link href="/purchase-orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Orden
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const count = orders.filter((o: PurchaseOrder) => o.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pagination?.total ?? 0} ordenes de compra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            isLoading={isLoading}
          />
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground py-2">
                {page} / {pagination.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
