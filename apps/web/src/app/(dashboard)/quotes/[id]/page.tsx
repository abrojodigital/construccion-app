'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface QuoteItem {
  id: string;
  quantity: string;
  unitPrice: string | null;
  notes: string | null;
  material: { id: string; code: string; name: string; unit: string };
}

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  status: string;
  requestDate: string;
  validUntil: string | null;
  subtotal: string | null;
  taxAmount: string | null;
  totalAmount: string | null;
  notes: string | null;
  supplier: { id: string; name: string; email: string | null; phone: string | null };
  items: QuoteItem[];
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

const STATUS_TRANSITIONS: Record<string, Array<{ to: string; label: string; variant: 'default' | 'outline' | 'destructive' }>> = {
  REQUESTED: [{ to: 'RECEIVED', label: 'Marcar como Recibida', variant: 'default' }, { to: 'EXPIRED', label: 'Marcar Vencida', variant: 'outline' }],
  RECEIVED: [{ to: 'ACCEPTED', label: 'Aceptar', variant: 'default' }, { to: 'REJECTED', label: 'Rechazar', variant: 'destructive' }],
};

export default function QuoteDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const quoteId = params.id as string;

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => api.get<QuoteDetail>(`/quotes/${quoteId}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/quotes/${quoteId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quote', quoteId] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Estado actualizado');
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
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Cotizacion no encontrada</p>
        <Link href="/quotes"><Button>Volver</Button></Link>
      </div>
    );
  }

  const transitions = STATUS_TRANSITIONS[quote.status] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quotes">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{quote.quoteNumber}</h1>
              <Badge variant={getStatusVariant(quote.status)}>
                {STATUS_LABELS[quote.status] ?? quote.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{quote.supplier.name}</p>
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
              {t.to === 'ACCEPTED' && <CheckCircle className="mr-2 h-4 w-4" />}
              {t.to === 'REJECTED' && <XCircle className="mr-2 h-4 w-4" />}
              {t.to === 'RECEIVED' && <Package className="mr-2 h-4 w-4" />}
              {t.to === 'EXPIRED' && <Clock className="mr-2 h-4 w-4" />}
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Informacion</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground">Proveedor</p>
                <p className="font-medium">{quote.supplier.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha solicitud</p>
                <p className="font-medium">{formatDate(quote.requestDate)}</p>
              </div>
              {quote.validUntil && (
                <div>
                  <p className="text-muted-foreground">Vence</p>
                  <p className="font-medium">{formatDate(quote.validUntil)}</p>
                </div>
              )}
            </div>
            {quote.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Notas</p>
                  <p>{quote.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {quote.totalAmount && (
          <Card>
            <CardHeader><CardTitle>Precios</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {quote.subtotal && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(quote.subtotal))}</span>
                </div>
              )}
              {quote.taxAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA / Impuestos</span>
                  <span>{formatCurrency(Number(quote.taxAmount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(Number(quote.totalAmount))}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Materiales</CardTitle>
          <CardDescription>{quote.items.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            <div className="grid grid-cols-12 gap-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span className="col-span-5">Material</span>
              <span className="col-span-2 text-right">Cantidad</span>
              <span className="col-span-3 text-right">Precio Unit.</span>
              <span className="col-span-2">Notas</span>
            </div>
            {quote.items.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 py-3 text-sm">
                <div className="col-span-5">
                  <p className="font-medium">{item.material.name}</p>
                  <p className="text-xs text-muted-foreground">{item.material.code}</p>
                </div>
                <span className="col-span-2 text-right">{Number(item.quantity)} {item.material.unit}</span>
                <span className="col-span-3 text-right">
                  {item.unitPrice ? formatCurrency(Number(item.unitPrice)) : <span className="text-muted-foreground">Sin precio</span>}
                </span>
                <span className="col-span-2 text-muted-foreground text-xs">{item.notes ?? '—'}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
