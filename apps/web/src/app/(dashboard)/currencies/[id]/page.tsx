'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { api } from '@/lib/api';
import { ExchangeRateForm } from '@/components/forms/exchange-rate-form';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface ExchangeRate {
  id: string;
  date: string;
  rate: string;
  source: string | null;
  fromCurrency: { id: string; code: string; name: string };
  toCurrency: { id: string; code: string; name: string };
}

interface CurrencyDetail {
  id: string;
  code: string;
  name: string;
  symbol: string;
  ratesFrom: ExchangeRate[];
  ratesTo: ExchangeRate[];
}

export default function CurrencyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currencyId = params.id as string;
  const [addRateDialogOpen, setAddRateDialogOpen] = useState(false);
  const [deleteRateId, setDeleteRateId] = useState<string | null>(null);

  const { data: currency, isLoading } = useQuery({
    queryKey: ['currency', currencyId],
    queryFn: () => api.get<CurrencyDetail>(`/currencies/${currencyId}`),
  });

  const deleteRateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/currencies/exchange-rates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency', currencyId] });
      toast.success('Cotizacion eliminada');
      setDeleteRateId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar la cotizacion');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded"></div>
        <Card>
          <CardContent className="p-6">
            <div className="h-20 animate-pulse bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currency) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">Moneda no encontrada</h2>
        <Link href="/currencies">
          <Button variant="link">Volver a monedas</Button>
        </Link>
      </div>
    );
  }

  const allRates = [...(currency.ratesFrom || []), ...(currency.ratesTo || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/currencies">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{currency.code}</Badge>
            </div>
            <h1 className="text-3xl font-bold">{currency.name}</h1>
            <p className="text-muted-foreground">Simbolo: {currency.symbol}</p>
          </div>
        </div>
        <Button onClick={() => setAddRateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Cotizacion
        </Button>
      </div>

      {/* Info Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Codigo</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency.code}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Simbolo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currency.symbol}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allRates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Cambio</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>De</TableHead>
                <TableHead>A</TableHead>
                <TableHead>Cotizacion</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Coins className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay cotizaciones registradas</p>
                      <Button size="sm" onClick={() => setAddRateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar cotizacion
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                allRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{formatDate(rate.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rate.fromCurrency.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rate.toCurrency.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(rate.rate).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4,
                      })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{rate.source || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteRateId(rate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Rate Dialog */}
      <Dialog open={addRateDialogOpen} onOpenChange={setAddRateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar Cotizacion</DialogTitle>
          </DialogHeader>
          <ExchangeRateForm
            defaultFromCurrencyId={currency.id}
            onSuccess={() => {
              setAddRateDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ['currency', currencyId] });
              toast.success('Cotizacion agregada correctamente');
            }}
            onCancel={() => setAddRateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Rate Confirmation */}
      <AlertDialog open={!!deleteRateId} onOpenChange={() => setDeleteRateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cotizacion</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estas seguro de que deseas eliminar esta cotizacion?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteRateId && deleteRateMutation.mutate(deleteRateId)}
            >
              {deleteRateMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
