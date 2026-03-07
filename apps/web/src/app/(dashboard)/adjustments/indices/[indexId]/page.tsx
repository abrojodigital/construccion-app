'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, TrendingUp } from 'lucide-react';
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
import { PriceIndexValueForm } from '@/components/forms/price-index-value-form';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface PriceIndexValue {
  id: string;
  date: string;
  value: string;
}

interface PriceIndexDetail {
  id: string;
  name: string;
  code: string;
  source: string | null;
  createdAt: string;
  values: PriceIndexValue[];
}

export default function PriceIndexDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const indexId = params.indexId as string;

  const [showAddValue, setShowAddValue] = useState(false);

  const { data: priceIndex, isLoading } = useQuery({
    queryKey: ['price-index', indexId],
    queryFn: () => api.get<PriceIndexDetail>(`/adjustments/indices/${indexId}`),
  });

  const addValueMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(`/adjustments/indices/${indexId}/values`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-index', indexId] });
      toast.success('Valor agregado/actualizado');
      setShowAddValue(false);
    },
    onError: () => toast.error('Error al guardar valor'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="h-64 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  if (!priceIndex) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-medium">Indice no encontrado</h2>
      </div>
    );
  }

  // Sort values by date descending
  const sortedValues = [...(priceIndex.values || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/adjustments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{priceIndex.name}</h1>
              <Badge variant="outline" className="font-mono">
                {priceIndex.code}
              </Badge>
            </div>
            {priceIndex.source && (
              <p className="text-muted-foreground">Fuente: {priceIndex.source}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setShowAddValue(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Valor
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Valores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sortedValues.length}</div>
          </CardContent>
        </Card>
        {sortedValues.length > 0 && (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ultimo Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {Number(sortedValues[0].value).toFixed(4)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(sortedValues[0].date)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Primer Valor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  {Number(sortedValues[sortedValues.length - 1].value).toFixed(4)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(sortedValues[sortedValues.length - 1].date)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Values Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Valores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedValues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay valores registrados. Agrega el primer valor al indice.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Variacion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedValues.map((val, i) => {
                  const prev = sortedValues[i + 1];
                  const variation = prev
                    ? ((Number(val.value) - Number(prev.value)) / Number(prev.value)) * 100
                    : null;
                  return (
                    <TableRow key={val.id}>
                      <TableCell className="font-mono">{formatDate(val.date)}</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {Number(val.value).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {variation !== null ? (
                          <span
                            className={
                              variation >= 0 ? 'text-destructive' : 'text-green-600'
                            }
                          >
                            {variation >= 0 ? '+' : ''}
                            {variation.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
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

      {/* Add Value Dialog */}
      <Dialog open={showAddValue} onOpenChange={setShowAddValue}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Valor al Indice</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Si ya existe un valor para la fecha indicada, sera actualizado automaticamente.
          </p>
          <PriceIndexValueForm
            onSubmit={async (data) => {
              await addValueMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
            }}
            onCancel={() => setShowAddValue(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
