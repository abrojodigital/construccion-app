'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, Trash2, Edit, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { EquipmentCatalogForm } from '@/components/forms/equipment-catalog-form';

interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  powerHp: string | null;
  newValue: string;
  residualPct: string;
  usefulLifeHours: string;
  amortPerHour: string;
  repairsPerHour: string;
  fuelPerHour: string;
  lubricantsPerHour: string;
  totalHourlyCost: string;
  isActive: boolean;
  _count?: { analysisEquipment: number };
}

export default function EquipmentCatalogPage() {
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<EquipmentItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment-catalog'],
    queryFn: () => api.get<EquipmentItem[]>('/equipment-catalog'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/equipment-catalog/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
      toast.success('Equipo eliminado correctamente');
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar el equipo');
    },
  });

  const filtered = equipment?.filter(
    (e) =>
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Equipos</h1>
          <p className="text-muted-foreground">
            Equipos con cálculo de costo horario (amortización + reparaciones + combustible)
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Equipo
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">HP</TableHead>
                <TableHead className="text-right">Amort/h</TableHead>
                <TableHead className="text-right">Repar/h</TableHead>
                <TableHead className="text-right">Comb/h</TableHead>
                <TableHead className="text-right">Lub/h</TableHead>
                <TableHead className="text-right">Total/h</TableHead>
                <TableHead className="text-right">En APUs</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !filtered?.length ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                    No se encontraron equipos
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell className="font-mono font-medium">{eq.code}</TableCell>
                    <TableCell className="font-medium">{eq.name}</TableCell>
                    <TableCell className="text-right">
                      {eq.powerHp ? `${Number(eq.powerHp)} HP` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(eq.amortPerHour))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(eq.repairsPerHour))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(eq.fuelPerHour))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(eq.lubricantsPerHour))}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(Number(eq.totalHourlyCost))}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {eq._count?.analysisEquipment ?? 0}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditItem(eq)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteId(eq.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Equipo</DialogTitle>
          </DialogHeader>
          <EquipmentCatalogForm
            onSuccess={() => {
              setCreateDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Equipo</DialogTitle>
          </DialogHeader>
          {editItem && (
            <EquipmentCatalogForm
              initialData={editItem}
              onSuccess={() => {
                setEditItem(null);
                queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar equipo</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar este equipo del catálogo?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
