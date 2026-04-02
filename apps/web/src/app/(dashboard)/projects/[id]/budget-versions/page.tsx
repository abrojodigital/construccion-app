'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  ArrowLeft,
  MoreHorizontal,
  Eye,
  Trash2,
  Calculator,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { BudgetVersionForm } from '@/components/forms/budget-version-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImportBudgetVersionDialog } from '@/components/forms/import-budget-version-dialog';
import { formatCurrency } from '@/lib/utils';
import { BUDGET_VERSION_STATUS_LABELS, BUDGET_VERSION_STATUS_COLORS } from '@construccion/shared';
import { toast } from 'sonner';

interface BudgetVersion {
  id: string;
  code: string;
  version: number;
  name: string;
  status: string;
  coeficienteK: string;
  totalCostoCosto: string;
  totalPrecio: string;
  _count?: { categories: number };
}

interface BudgetVersionsResponse {
  data: BudgetVersion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'success' as const;
    case 'DRAFT':
      return 'warning' as const;
    case 'SUPERSEDED':
      return 'secondary' as const;
    default:
      return 'default' as const;
  }
};

export default function BudgetVersionsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['budget-versions', projectId, page],
    queryFn: () =>
      api.get<BudgetVersionsResponse>(`/projects/${projectId}/budget-versions`, {
        params: { page, limit: 20 },
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budget-versions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-versions', projectId] });
      toast.success('Version eliminada correctamente');
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar la version');
    },
  });

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
            <h1 className="text-3xl font-bold">Versiones de Presupuesto</h1>
            <p className="text-muted-foreground">
              Gestiona las versiones de presupuesto del proyecto
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Version
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>K</TableHead>
                <TableHead className="text-right">Costo-Costo</TableHead>
                <TableHead className="text-right">Precio Total</TableHead>
                <TableHead>Cap.</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Calculator className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay versiones de presupuesto</p>
                      <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear primera version
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <Badge variant="outline">{version.code}</Badge>
                    </TableCell>
                    <TableCell>v{version.version}</TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${projectId}/budget-versions/${version.id}`}
                        className="font-medium hover:underline"
                      >
                        {version.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(version.status)}>
                        {BUDGET_VERSION_STATUS_LABELS[
                          version.status as keyof typeof BUDGET_VERSION_STATUS_LABELS
                        ] || version.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {Number(version.coeficienteK).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Number(version.totalCostoCosto))}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Number(version.totalPrecio))}
                    </TableCell>
                    <TableCell>{version._count?.categories || 0}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/projects/${projectId}/budget-versions/${version.id}`}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          {version.status === 'DRAFT' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeleteId(version.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Versión de Presupuesto</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="manual">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="manual" className="flex-1">
                Crear manualmente
              </TabsTrigger>
              <TabsTrigger value="import" className="flex-1">
                Importar desde Excel
              </TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <BudgetVersionForm
                projectId={projectId}
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['budget-versions', projectId] });
                  toast.success('Versión creada correctamente');
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </TabsContent>
            <TabsContent value="import">
              <ImportBudgetVersionDialog
                projectId={projectId}
                onSuccess={(versionId) => {
                  setCreateDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['budget-versions', projectId] });
                  toast.success('Presupuesto importado correctamente');
                  router.push(`/projects/${projectId}/budget-versions/${versionId}`);
                }}
                onCancel={() => setCreateDialogOpen(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Version</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar esta version? Se eliminaran todos los capitulos
              e items asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
