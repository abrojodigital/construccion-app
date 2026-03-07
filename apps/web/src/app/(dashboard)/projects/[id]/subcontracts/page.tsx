'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  SUBCONTRACT_STATUS_LABELS,
  SUBCONTRACT_STATUS_COLORS,
} from '@construccion/shared/constants';

type SubcontractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface Subcontract {
  id: string;
  code: string;
  name: string;
  contractorName: string;
  status: SubcontractStatus;
  totalAmount: string;
  _count?: { items: number; certificates: number };
  createdAt: string;
}

interface SubcontractListResponse {
  data: Subcontract[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const statusBadgeVariant = (color: string) => {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    gray: 'secondary',
    green: 'default',
    blue: 'default',
    red: 'destructive',
  };
  return map[color] || 'secondary';
};

export default function SubcontractsPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['subcontracts', projectId, page, search],
    queryFn: () =>
      api.get<SubcontractListResponse>(
        `/projects/${projectId}/subcontracts?page=${page}&limit=20&sortOrder=desc${search ? `&search=${encodeURIComponent(search)}` : ''}`
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subcontracts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontracts', projectId] });
      toast.success('Subcontrato eliminado');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Error al eliminar subcontrato');
    },
  });

  const subcontracts = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Subcontrataciones</h1>
            <p className="text-muted-foreground">Contratos con terceros del proyecto</p>
          </div>
        </div>
        <Link href={`/projects/${projectId}/subcontracts/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Subcontrato
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, contratista o codigo..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : subcontracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Sin subcontrataciones</h3>
              <p className="text-muted-foreground mt-2">
                Crea el primer subcontrato para este proyecto.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contratista</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-center">Certif.</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcontracts.map((sub) => {
                  const statusColor = SUBCONTRACT_STATUS_COLORS[sub.status] || 'gray';
                  const statusLabel = SUBCONTRACT_STATUS_LABELS[sub.status] || sub.status;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <Link
                          href={`/projects/${projectId}/subcontracts/${sub.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {sub.code}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {sub.name}
                      </TableCell>
                      <TableCell>{sub.contractorName}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(statusColor)}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(Number(sub.totalAmount))}
                      </TableCell>
                      <TableCell className="text-center">
                        {sub._count?.items ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {sub._count?.certificates ?? 0}
                      </TableCell>
                      <TableCell>
                        {sub.status === 'DRAFT' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDeleteId(sub.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando pagina {pagination.page} de {totalPages} ({pagination.total} subcontratos)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Subcontrato</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El subcontrato y todos sus items seran eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
