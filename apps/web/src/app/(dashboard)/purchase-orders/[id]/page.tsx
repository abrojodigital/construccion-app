'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  Calendar,
  Building2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface PurchaseOrderItem {
  id: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  deliveredQty: string;
  notes: string | null;
  material: { id: string; code: string; name: string; unit: string };
}

interface PurchaseOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  project: { id: string; code: string; name: string };
  supplier: { id: string; name: string; phone: string | null; email: string | null };
  createdBy: { firstName: string; lastName: string };
  items: PurchaseOrderItem[];
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

const STATUS_TRANSITIONS: Record<string, Array<{ to: string; label: string; variant: 'default' | 'outline' | 'destructive' }>> = {
  DRAFT: [{ to: 'SENT', label: 'Enviar al Proveedor', variant: 'default' }, { to: 'CANCELLED', label: 'Cancelar', variant: 'destructive' }],
  SENT: [{ to: 'CONFIRMED', label: 'Marcar como Confirmada', variant: 'default' }, { to: 'CANCELLED', label: 'Cancelar', variant: 'destructive' }],
  CONFIRMED: [{ to: 'PARTIAL_DELIVERY', label: 'Entrega Parcial', variant: 'outline' }, { to: 'COMPLETED', label: 'Completar', variant: 'default' }, { to: 'CANCELLED', label: 'Cancelar', variant: 'destructive' }],
  PARTIAL_DELIVERY: [{ to: 'COMPLETED', label: 'Completar Entrega', variant: 'default' }],
};

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['purchase-order', orderId],
    queryFn: () => api.get<PurchaseOrderDetail>(`/purchase-orders/${orderId}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/purchase-orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Estado actualizado exitosamente');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al actualizar el estado'),
  });

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

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Orden de compra no encontrada</p>
        <Link href="/purchase-orders"><Button>Volver</Button></Link>
      </div>
    );
  }

  const transitions = STATUS_TRANSITIONS[order.status] ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
              <Badge variant={getStatusVariant(order.status)}>
                {STATUS_LABELS[order.status] ?? order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{order.supplier.name} — {order.project.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {transitions.map((t) => (
            <Button
              key={t.to}
              variant={t.variant}
              size="sm"
              onClick={() => updateStatusMutation.mutate(t.to)}
              disabled={updateStatusMutation.isPending}
            >
              {t.to === 'SENT' && <Send className="mr-2 h-4 w-4" />}
              {t.to === 'COMPLETED' && <CheckCircle className="mr-2 h-4 w-4" />}
              {t.to === 'CANCELLED' && <XCircle className="mr-2 h-4 w-4" />}
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos principales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informacion de la Orden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Fecha de orden</p>
                <p className="font-medium">{formatDate(order.orderDate)}</p>
              </div>
              {order.expectedDeliveryDate && (
                <div>
                  <p className="text-muted-foreground">Entrega esperada</p>
                  <p className="font-medium">{formatDate(order.expectedDeliveryDate)}</p>
                </div>
              )}
              {order.actualDeliveryDate && (
                <div>
                  <p className="text-muted-foreground">Entrega real</p>
                  <p className="font-medium">{formatDate(order.actualDeliveryDate)}</p>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Direccion de entrega</p>
                  <p className="font-medium">{order.deliveryAddress}</p>
                </div>
              )}
            </div>
            {order.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Proveedor y Proyecto */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.supplier.name}</p>
              {order.supplier.phone && <p className="text-muted-foreground">{order.supplier.phone}</p>}
              {order.supplier.email && <p className="text-muted-foreground">{order.supplier.email}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <Link href={`/projects/${order.project.id}`} className="font-medium text-primary hover:underline">
                {order.project.code} - {order.project.name}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Materiales Solicitados</CardTitle>
          <CardDescription>{order.items.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y">
            <div className="grid grid-cols-12 gap-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span className="col-span-4">Material</span>
              <span className="col-span-2 text-right">Cantidad</span>
              <span className="col-span-2 text-right">Precio Unit.</span>
              <span className="col-span-2 text-right">Total</span>
              <span className="col-span-2 text-right">Entregado</span>
            </div>
            {order.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 py-3 text-sm">
                <div className="col-span-4">
                  <p className="font-medium">{item.material.name}</p>
                  <p className="text-xs text-muted-foreground">{item.material.code}</p>
                  {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                </div>
                <span className="col-span-2 text-right">{Number(item.quantity)} {item.material.unit}</span>
                <span className="col-span-2 text-right">{formatCurrency(Number(item.unitPrice))}</span>
                <span className="col-span-2 text-right font-medium">{formatCurrency(Number(item.totalPrice))}</span>
                <span className="col-span-2 text-right text-muted-foreground">{Number(item.deliveredQty)} {item.material.unit}</span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-1 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA / Impuestos</span>
              <span>{formatCurrency(Number(order.taxAmount))}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(Number(order.totalAmount))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
