'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  History,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface SupplierMaterial {
  id: string;
  unitPrice: string;
  leadTimeDays: number | null;
  isPreferred: boolean;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
}

interface MaterialDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  currentStock: string;
  minimumStock: string;
  maximumStock: string | null;
  lastPurchasePrice: string | null;
  averagePrice: string | null;
  isActive: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
    code: string;
  };
  supplierMaterials: SupplierMaterial[];
}

interface StockMovement {
  id: string;
  quantity: string;
  movementType: string;
  reason: string | null;
  unitCost: string | null;
  totalCost: string | null;
  createdAt: string;
  project: { id: string; code: string; name: string } | null;
}

export default function MaterialDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const materialId = params.id as string;

  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [unitCost, setUnitCost] = useState('');

  const { data: material, isLoading } = useQuery({
    queryKey: ['material', materialId],
    queryFn: () => api.get<MaterialDetail>(`/materials/${materialId}`),
  });

  const { data: stockMovements } = useQuery({
    queryKey: ['material-stock', materialId],
    queryFn: () => api.get<StockMovement[]>(`/materials/${materialId}/stock`),
    enabled: !!material,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/materials/${materialId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material eliminado');
      router.push('/materials');
    },
    onError: () => {
      toast.error('Error al eliminar el material');
    },
  });

  const stockMovementMutation = useMutation({
    mutationFn: (data: { quantity: number; movementType: string; reason: string; unitCost?: number }) =>
      api.post(`/materials/${materialId}/stock-movement`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material', materialId] });
      queryClient.invalidateQueries({ queryKey: ['material-stock', materialId] });
      toast.success('Movimiento de stock registrado');
      setStockDialogOpen(false);
      setQuantity('');
      setReason('');
      setUnitCost('');
    },
    onError: () => {
      toast.error('Error al registrar el movimiento');
    },
  });

  const handleStockMovement = () => {
    if (!quantity || Number(quantity) <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    stockMovementMutation.mutate({
      quantity: Number(quantity),
      movementType,
      reason,
      unitCost: unitCost ? Number(unitCost) : undefined,
    });
  };

  const isLowStock = material && Number(material.currentStock) <= Number(material.minimumStock);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Material no encontrado</p>
        <Link href="/materials">
          <Button>Volver a materiales</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/materials">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{material.name}</h1>
              <Badge variant="outline">{material.code}</Badge>
              <Badge variant={material.isActive ? 'success' : 'secondary'}>
                {material.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
              {isLowStock && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Stock Bajo
                </Badge>
              )}
            </div>
            {material.description && (
              <p className="text-muted-foreground">{material.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                Movimiento Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
                <DialogDescription>
                  Ingrese los datos del movimiento de stock para {material.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Movimiento</label>
                  <Select value={movementType} onValueChange={(v) => setMovementType(v as 'IN' | 'OUT')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-600" />
                          Entrada
                        </div>
                      </SelectItem>
                      <SelectItem value="OUT">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-600" />
                          Salida
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cantidad ({material.unit})</label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                {movementType === 'IN' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Costo Unitario (opcional)</label>
                    <Input
                      type="number"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo</label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Compra, ajuste de inventario, consumo..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStockDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleStockMovement} disabled={stockMovementMutation.isPending}>
                  {stockMovementMutation.isPending ? 'Registrando...' : 'Registrar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href={`/materials/${materialId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar Material</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion no se puede deshacer. El material sera eliminado permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => deleteMutation.mutate()}
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informacion del Material */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informacion del Material
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Categoria</p>
                <Badge variant="secondary">{material.category.name}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unidad de Medida</p>
                <p className="font-medium">{material.unit}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Ultimo Precio de Compra</p>
              <p className="text-2xl font-bold text-primary">
                {material.lastPurchasePrice
                  ? formatCurrency(Number(material.lastPurchasePrice))
                  : '-'}
              </p>
            </div>
            {material.averagePrice && (
              <div>
                <p className="text-sm text-muted-foreground">Precio Promedio</p>
                <p className="font-medium">{formatCurrency(Number(material.averagePrice))}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock */}
        <Card className={isLowStock ? 'border-yellow-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLowStock ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <TrendingUp className="h-5 w-5" />
              )}
              Control de Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Stock Actual</p>
              <p className={`text-3xl font-bold ${isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                {Number(material.currentStock).toLocaleString('es-AR')} {material.unit}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Stock Minimo</p>
                <p className="font-medium text-yellow-600">
                  {Number(material.minimumStock).toLocaleString('es-AR')} {material.unit}
                </p>
              </div>
              {material.maximumStock && (
                <div>
                  <p className="text-sm text-muted-foreground">Stock Maximo</p>
                  <p className="font-medium">
                    {Number(material.maximumStock).toLocaleString('es-AR')} {material.unit}
                  </p>
                </div>
              )}
            </div>
            {isLowStock && (
              <>
                <Separator />
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    El stock esta por debajo del minimo. Se recomienda realizar una compra.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Proveedores */}
      {material.supplierMaterials && material.supplierMaterials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Proveedores
            </CardTitle>
            <CardDescription>
              Proveedores que suministran este material
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">Tiempo Entrega</TableHead>
                  <TableHead>Preferido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {material.supplierMaterials.map((sm) => (
                  <TableRow key={sm.id}>
                    <TableCell>
                      <Badge variant="outline">{sm.supplier.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/suppliers/${sm.supplier.id}`}
                        className="font-medium hover:underline"
                      >
                        {sm.supplier.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(sm.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      {sm.leadTimeDays ? `${sm.leadTimeDays} dias` : '-'}
                    </TableCell>
                    <TableCell>
                      {sm.isPreferred && <Badge variant="success">Preferido</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Movimientos de Stock */}
      {stockMovements && stockMovements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Movimientos
            </CardTitle>
            <CardDescription>
              Ultimos movimientos de stock del material
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Costo Unit.</TableHead>
                  <TableHead className="text-right">Costo Total</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Proyecto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(movement.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={movement.movementType === 'IN' ? 'success' : 'destructive'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {movement.movementType === 'IN' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {movement.movementType === 'IN' ? 'Entrada' : 'Salida'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {movement.movementType === 'IN' ? '+' : '-'}
                      {Number(movement.quantity).toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.unitCost ? formatCurrency(Number(movement.unitCost)) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {movement.totalCost ? formatCurrency(Number(movement.totalCost)) : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {movement.reason || '-'}
                    </TableCell>
                    <TableCell>
                      {movement.project ? (
                        <Link
                          href={`/projects/${movement.project.id}`}
                          className="text-primary hover:underline"
                        >
                          {movement.project.code}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
