'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Trash2, TrendingUp, BookOpen, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { PriceIndexForm } from '@/components/forms/price-index-form';
import { CalculateAdjustmentForm } from '@/components/forms/calculate-adjustment-form';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface PriceIndex {
  id: string;
  name: string;
  code: string;
  source: string | null;
  _count?: { values: number };
  createdAt: string;
}

interface AdjustmentFormula {
  id: string;
  name: string;
  budgetVersion?: { id: string; name: string; code: string };
  weights: {
    id: string;
    component: string;
    weight: string;
    priceIndex: { name: string; code: string };
  }[];
  createdAt: string;
}

interface CalculationResult {
  formulaName: string;
  baseDate: string;
  currentDate: string;
  factor: number;
  variationPct: number;
  details: {
    component: string;
    weight: number;
    indexName: string;
    indexCode: string;
    baseValue: number;
    baseDate: string;
    currentValue: number;
    currentDate: string;
    ratio: number;
    contribution: number;
  }[];
}

export default function AdjustmentsPage() {
  const queryClient = useQueryClient();

  const [showCreateIndex, setShowCreateIndex] = useState(false);
  const [deleteIndexId, setDeleteIndexId] = useState<string | null>(null);
  const [deleteFormulaId, setDeleteFormulaId] = useState<string | null>(null);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);

  // Fetch indices
  const { data: indices, isLoading: loadingIndices } = useQuery({
    queryKey: ['price-indices'],
    queryFn: () => api.get<PriceIndex[]>('/adjustments/indices'),
  });

  // Fetch formulas
  const { data: formulas, isLoading: loadingFormulas } = useQuery({
    queryKey: ['adjustment-formulas'],
    queryFn: () => api.get<AdjustmentFormula[]>('/adjustments/formulas'),
  });

  const createIndexMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post('/adjustments/indices', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-indices'] });
      toast.success('Indice creado');
      setShowCreateIndex(false);
    },
    onError: () => toast.error('Error al crear indice'),
  });

  const deleteIndexMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/adjustments/indices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-indices'] });
      toast.success('Indice eliminado');
      setDeleteIndexId(null);
    },
    onError: () => toast.error('Error al eliminar indice'),
  });

  const deleteFormulaMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/adjustments/formulas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustment-formulas'] });
      toast.success('Formula eliminada');
      setDeleteFormulaId(null);
    },
    onError: () => toast.error('Error al eliminar formula'),
  });

  const calculateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<CalculationResult>('/adjustments/calculate', data),
    onSuccess: (result) => {
      setCalcResult(result);
    },
    onError: () => toast.error('Error al calcular factor de ajuste'),
  });

  const indexList = Array.isArray(indices) ? indices : [];
  const formulaList = Array.isArray(formulas) ? formulas : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Redeterminacion de Precios</h1>
        <p className="text-muted-foreground">
          Gestion de indices, formulas polinomicas y calculo de factores de ajuste
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="indices">
        <TabsList>
          <TabsTrigger value="indices" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Indices de Precios
          </TabsTrigger>
          <TabsTrigger value="formulas" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Formulas
          </TabsTrigger>
          <TabsTrigger value="calculate" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calcular
          </TabsTrigger>
        </TabsList>

        {/* Tab: Indices */}
        <TabsContent value="indices" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateIndex(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Indice
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingIndices ? (
                <div className="space-y-4 p-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : indexList.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Sin indices de precios</h3>
                  <p className="text-muted-foreground mt-2">
                    Crea indices para comenzar a registrar variaciones de precios.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fuente</TableHead>
                      <TableHead className="text-center">Valores</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {indexList.map((idx) => (
                      <TableRow key={idx.id}>
                        <TableCell>
                          <Link
                            href={`/adjustments/indices/${idx.id}`}
                            className="font-mono text-primary hover:underline"
                          >
                            {idx.code}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{idx.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {idx.source || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{idx._count?.values ?? 0}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(idx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDeleteIndexId(idx.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Formulas */}
        <TabsContent value="formulas" className="space-y-4">
          <div className="flex justify-end">
            <p className="text-sm text-muted-foreground flex-1">
              Las formulas se crean desde la pagina de cada proyecto (presupuesto aprobado requerido).
            </p>
          </div>
          <Card>
            <CardContent className="p-0">
              {loadingFormulas ? (
                <div className="space-y-4 p-6">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : formulaList.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Sin formulas</h3>
                  <p className="text-muted-foreground mt-2">
                    Crea formulas polinomicas desde la vista de proyecto.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Presupuesto</TableHead>
                      <TableHead>Componentes</TableHead>
                      <TableHead>Creada</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formulaList.map((formula) => (
                      <TableRow key={formula.id}>
                        <TableCell>
                          <Link
                            href={`/adjustments/formulas/${formula.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {formula.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formula.budgetVersion?.code ?? '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {formula.weights.map((w) => (
                              <Badge key={w.id} variant="outline" className="text-xs">
                                {w.component}: {(Number(w.weight) * 100).toFixed(1)}%
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(formula.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDeleteFormulaId(formula.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Calculate */}
        <TabsContent value="calculate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calcular Factor de Ajuste</CardTitle>
            </CardHeader>
            <CardContent>
              <CalculateAdjustmentForm
                onSubmit={async (data) => {
                  await calculateMutation.mutateAsync(
                    data as unknown as Record<string, unknown>
                  );
                }}
              />
            </CardContent>
          </Card>

          {/* Calculation Result */}
          {calcResult && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado del Calculo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Factor de Ajuste</p>
                      <p className="text-4xl font-bold font-mono text-primary">
                        {calcResult.factor.toFixed(4)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Variacion</p>
                      <p
                        className={`text-4xl font-bold font-mono ${
                          calcResult.variationPct >= 0 ? 'text-destructive' : 'text-green-600'
                        }`}
                      >
                        {calcResult.variationPct >= 0 ? '+' : ''}
                        {calcResult.variationPct.toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground">Formula</p>
                      <p className="text-lg font-medium">{calcResult.formulaName}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {formatDate(calcResult.baseDate)} → {formatDate(calcResult.currentDate)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detail Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Componente</TableHead>
                      <TableHead>Indice</TableHead>
                      <TableHead className="text-right">Peso</TableHead>
                      <TableHead className="text-right">Valor Base</TableHead>
                      <TableHead className="text-right">Valor Actual</TableHead>
                      <TableHead className="text-right">Relacion</TableHead>
                      <TableHead className="text-right">Contribucion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calcResult.details.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{d.component}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {d.indexName} ({d.indexCode})
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {(d.weight * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {d.baseValue.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {d.currentValue.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {d.ratio.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {d.contribution.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={6} className="text-right font-medium">
                        Factor Total
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {calcResult.factor.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Index Dialog */}
      <Dialog open={showCreateIndex} onOpenChange={setShowCreateIndex}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Indice de Precios</DialogTitle>
          </DialogHeader>
          <PriceIndexForm
            onSubmit={async (data) => {
              await createIndexMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
            }}
            onCancel={() => setShowCreateIndex(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Index */}
      <AlertDialog open={!!deleteIndexId} onOpenChange={() => setDeleteIndexId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Indice</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminaran todos los valores asociados a este indice. Esta accion no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteIndexId && deleteIndexMutation.mutate(deleteIndexId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Formula */}
      <AlertDialog open={!!deleteFormulaId} onOpenChange={() => setDeleteFormulaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Formula</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara la formula y todos sus componentes. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteFormulaId && deleteFormulaMutation.mutate(deleteFormulaId)
              }
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
