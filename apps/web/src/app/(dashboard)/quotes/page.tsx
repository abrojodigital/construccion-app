'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  totalAmount: string | null;
  requestDate: string;
  validUntil: string | null;
  supplier: { id: string; name: string };
  items: Array<{ id: string }>;
}

interface QuotesResponse {
  data: Quote[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Solicitada',
  RECEIVED: 'Recibida',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
};

function getStatusVariant(status: string) {
  switch (status) {
    case 'ACCEPTED': return 'success';
    case 'RECEIVED': return 'warning';
    case 'REJECTED':
    case 'EXPIRED': return 'destructive';
    default: return 'secondary';
  }
}

export default function QuotesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', page, search, statusFilter],
    queryFn: () =>
      api.get<QuotesResponse>('/quotes', {
        params: {
          page,
          limit: 20,
          ...(search && { search }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
        },
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quotes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotizacion eliminada');
    },
    onError: () => toast.error('Error al eliminar la cotizacion'),
  });

  const quotes = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;

  const columns = [
    {
      accessorKey: 'quoteNumber',
      header: 'Numero',
      cell: ({ row }: any) => (
        <Link href={`/quotes/${row.original.id}`} className="font-mono text-sm text-primary hover:underline">
          {row.original.quoteNumber}
        </Link>
      ),
    },
    {
      accessorKey: 'supplier.name',
      header: 'Proveedor',
      cell: ({ row }: any) => <span className="text-sm">{row.original.supplier.name}</span>,
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
      cell: ({ row }: any) =>
        row.original.totalAmount
          ? <span className="font-medium">{formatCurrency(Number(row.original.totalAmount))}</span>
          : <span className="text-muted-foreground text-sm">Sin precio</span>,
    },
    {
      accessorKey: 'requestDate',
      header: 'Fecha solicitud',
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.requestDate)}</span>
      ),
    },
    {
      accessorKey: 'validUntil',
      header: 'Vence',
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">
          {row.original.validUntil ? formatDate(row.original.validUntil) : '—'}
        </span>
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
              <Link href={`/quotes/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteMutation.mutate(row.original.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cotizaciones</h1>
          <p className="text-muted-foreground">Solicitudes y respuestas de cotizacion a proveedores</p>
        </div>
        <Link href="/quotes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotizacion
          </Button>
        </Link>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>{pagination?.total ?? 0} cotizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={quotes} isLoading={isLoading} />
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground py-2">{page} / {pagination.totalPages}</span>
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
