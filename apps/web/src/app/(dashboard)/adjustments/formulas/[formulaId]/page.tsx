'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AdjustmentWeight {
  id: string;
  component: string;
  weight: string;
  priceIndex: {
    id: string;
    name: string;
    code: string;
  };
}

interface FormulaDetail {
  id: string;
  name: string;
  budgetVersion?: {
    id: string;
    name: string;
    code: string;
  };
  weights: AdjustmentWeight[];
  createdAt: string;
}

export default function FormulaDetailPage() {
  const params = useParams();
  const formulaId = params.formulaId as string;

  const { data: formula, isLoading } = useQuery({
    queryKey: ['adjustment-formula', formulaId],
    queryFn: () => api.get<FormulaDetail>(`/adjustments/formulas/${formulaId}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="h-64 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  if (!formula) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-medium">Formula no encontrada</h2>
      </div>
    );
  }

  const totalWeight = formula.weights.reduce(
    (sum, w) => sum + Number(w.weight),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/adjustments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{formula.name}</h1>
          <p className="text-muted-foreground">
            Formula polinomica creada el {formatDate(formula.createdAt)}
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            {formula.budgetVersion ? (
              <>
                <p className="font-medium">{formula.budgetVersion.name}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {formula.budgetVersion.code}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">-</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Componentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formula.weights.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peso Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${
                Math.abs(totalWeight - 1) < 0.002 ? 'text-green-600' : 'text-destructive'
              }`}
            >
              {(totalWeight * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weights Table */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes de la Formula</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Componente</TableHead>
                <TableHead>Indice de Referencia</TableHead>
                <TableHead className="text-right">Peso</TableHead>
                <TableHead className="w-[200px]">Distribucion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formula.weights.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.component}</TableCell>
                  <TableCell>
                    <Link
                      href={`/adjustments/indices/${w.priceIndex.id}`}
                      className="text-primary hover:underline"
                    >
                      {w.priceIndex.name}
                    </Link>
                    <span className="text-muted-foreground ml-2 font-mono text-sm">
                      ({w.priceIndex.code})
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {(Number(w.weight) * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <Progress value={Number(w.weight) * 100} className="h-2" />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={2} className="text-right font-medium">
                  Total
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                  {(totalWeight * 100).toFixed(1)}%
                </TableCell>
                <TableCell>
                  <Progress value={totalWeight * 100} className="h-2" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Formula Visual */}
      <Card>
        <CardHeader>
          <CardTitle>Representacion de la Formula</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <p className="mb-2 text-muted-foreground">K = </p>
            {formula.weights.map((w, i) => (
              <p key={w.id} className="ml-4">
                {i > 0 && '+ '}
                {(Number(w.weight) * 100).toFixed(1)}% × ({w.priceIndex.code}
                <sub>actual</sub> / {w.priceIndex.code}
                <sub>base</sub>)
                <span className="text-muted-foreground ml-2">/* {w.component} */</span>
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
