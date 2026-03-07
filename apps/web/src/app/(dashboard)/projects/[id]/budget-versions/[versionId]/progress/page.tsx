'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, BarChart3, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { api } from '@/lib/api';
import { ProgressForm } from '@/components/forms/progress-form';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface ProgressItem {
  budgetItemId: string;
  number: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  advance: number;
  executedAmount: number;
  lastDate: string | null;
}

interface StageProgress {
  stageId: string;
  stageNumber: string;
  description: string;
  advance: number;
  totalBudget: number;
  executedBudget: number;
  items: ProgressItem[];
}

interface CategoryProgress {
  categoryId: string;
  categoryNumber: number;
  name: string;
  advance: number;
  totalBudget: number;
  executedBudget: number;
  stages: StageProgress[];
}

interface ProgressSummary {
  overallAdvance: number;
  totalBudget: number;
  executedBudget: number;
  categories: CategoryProgress[];
}

export default function ProgressPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const versionId = params.versionId as string;

  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    description: string;
    advance: number;
  } | null>(null);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: summary, isLoading } = useQuery({
    queryKey: ['progress-summary', versionId],
    queryFn: () => api.get<ProgressSummary>(`/budget-versions/${versionId}/progress-summary/summary`),
  });

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">No se encontro el resumen de avance</h2>
      </div>
    );
  }

  const overallPct = summary.overallAdvance * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}/budget-versions/${versionId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Avance Fisico</h1>
          <p className="text-muted-foreground">Resumen de avance de obra</p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Avance General</h2>
            <span className="text-3xl font-bold text-primary">{overallPct.toFixed(1)}%</span>
          </div>
          <Progress value={overallPct} className="h-4" />
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(Number(summary.totalBudget), { compact: true })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ejecutado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(Number(summary.executedBudget), { compact: true })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avance General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallPct.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Categories with stages and items */}
      {summary.categories.map((category) => {
        const isCatExpanded = expandedCategories.has(category.categoryId);
        const catPct = category.advance * 100;

        return (
          <Card key={category.categoryId}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleCategory(category.categoryId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isCatExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  <CardTitle>
                    Categoria {category.categoryNumber}: {category.name}
                  </CardTitle>
                </div>
                <Badge variant="outline">{catPct.toFixed(1)}%</Badge>
              </div>
              <Progress value={catPct} className="h-2" />
            </CardHeader>

            {isCatExpanded && (
              <CardContent className="p-0">
                {category.stages.map((stage) => (
                  <div key={stage.stageId} className="border-t">
                    <div className="px-6 py-3 bg-muted/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          <span className="font-mono text-sm mr-2">{stage.stageNumber}</span>
                          {stage.description}
                        </span>
                        <Badge variant="secondary">{(stage.advance * 100).toFixed(1)}%</Badge>
                      </div>
                      <Progress value={stage.advance * 100} className="h-1.5" />
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nro</TableHead>
                          <TableHead>Descripcion</TableHead>
                          <TableHead>Avance</TableHead>
                          <TableHead className="text-right">Ejecutado</TableHead>
                          <TableHead>Ultima Fecha</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stage.items.map((item) => (
                          <TableRow key={item.budgetItemId}>
                            <TableCell className="font-mono">{item.number}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-24">
                                  <Progress value={item.advance * 100} className="h-2" />
                                </div>
                                <span className="text-sm font-mono">
                                  {(item.advance * 100).toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(item.executedAmount, { compact: true })}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.lastDate ? formatDate(item.lastDate) : '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedItem({
                                    id: item.budgetItemId,
                                    description: item.description,
                                    advance: item.advance,
                                  })
                                }
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Avance
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Progress Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Avance</DialogTitle>
            {selectedItem && (
              <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
            )}
          </DialogHeader>
          {selectedItem && (
            <ProgressForm
              budgetItemId={selectedItem.id}
              currentAdvance={selectedItem.advance}
              onSuccess={() => {
                setSelectedItem(null);
                queryClient.invalidateQueries({ queryKey: ['progress-summary', versionId] });
                toast.success('Avance registrado');
              }}
              onCancel={() => setSelectedItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
