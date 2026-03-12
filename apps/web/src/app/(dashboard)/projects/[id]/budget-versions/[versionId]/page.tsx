'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  RefreshCw,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  CalendarClock,
} from 'lucide-react';
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
import { BudgetVersionForm } from '@/components/forms/budget-version-form';
import { BudgetCategoryForm } from '@/components/forms/budget-category-form';
import { BudgetStageForm } from '@/components/forms/budget-stage-form';
import { BudgetItemForm } from '@/components/forms/budget-item-form';
import { formatCurrency } from '@/lib/utils';
import { BUDGET_VERSION_STATUS_LABELS } from '@construccion/shared';
import { toast } from 'sonner';

// ============================================
// Interfaces
// ============================================

interface BudgetItem {
  id: string;
  number: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  priceAnalysis?: { id: string } | null;
}

interface BudgetStage {
  id: string;
  number: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  incidencePct: string;
  items: BudgetItem[];
}

interface BudgetCategory {
  id: string;
  number: number;
  name: string;
  description: string | null;
  order: number;
  subtotalCostoCosto: string;
  stages: BudgetStage[];
}

interface BudgetVersionDetail {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string | null;
  status: string;
  gastosGeneralesPct: string;
  beneficioPct: string;
  gastosFinancierosPct: string;
  ivaPct: string;
  coeficienteK: string;
  totalCostoCosto: string;
  totalPrecio: string;
  projectId: string;
  categories: BudgetCategory[];
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'success' as const;
    case 'DRAFT':
      return 'warning' as const;
    default:
      return 'secondary' as const;
  }
};

export default function BudgetVersionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const versionId = params.versionId as string;

  // UI state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [editVersionOpen, setEditVersionOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<BudgetCategory | null>(null);
  const [addStageCategoryId, setAddStageCategoryId] = useState<string | null>(null);
  const [editStage, setEditStage] = useState<{ stage: BudgetStage; categoryId: string } | null>(null);
  const [addItemStageId, setAddItemStageId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<{ item: BudgetItem; stageId: string } | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'replace' | 'append'>('replace');

  // Data queries
  const { data: version, isLoading } = useQuery({
    queryKey: ['budget-version', versionId],
    queryFn: () => api.get<BudgetVersionDetail>(`/budget-versions/${versionId}`),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['budget-version', versionId] });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: () => api.post<any>(`/budget-versions/${versionId}/approve`),
    onSuccess: (data) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['budget-versions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stages', projectId] });
      const s = data?.scheduleGenerated;
      if (s) {
        toast.success(
          `Presupuesto aprobado. Cronograma generado: ${s.stagesCreated} rubros/tareas`
        );
      } else {
        toast.success('Presupuesto aprobado correctamente');
      }
      setApproveDialogOpen(false);
    },
    onError: (error: any) => toast.error(error.message || 'Error al aprobar'),
  });

  const recalculateMutation = useMutation({
    mutationFn: () => api.post(`/budget-versions/${versionId}/recalculate`),
    onSuccess: () => {
      invalidate();
      toast.success('K y totales recalculados');
    },
    onError: (error: any) => toast.error(error.message || 'Error al recalcular'),
  });

  const revertToDraftMutation = useMutation({
    mutationFn: () => api.post(`/budget-versions/${versionId}/revert-to-draft`),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['budget-versions', projectId] });
      toast.success('Presupuesto revertido a Borrador');
    },
    onError: (error: any) => toast.error(error.message || 'Error al revertir'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budget-versions/${versionId}/categories/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Rubro eliminado');
      setDeleteCategoryId(null);
    },
    onError: (error: any) => toast.error(error.message || 'Error al eliminar rubro'),
  });

  const deleteStageMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budget-versions/${versionId}/stages/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Item eliminado');
      setDeleteStageId(null);
    },
    onError: (error: any) => toast.error(error.message || 'Error al eliminar item'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budget-versions/${versionId}/items/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Item Análisis eliminado');
      setDeleteItemId(null);
    },
    onError: (error: any) => toast.error(error.message || 'Error al eliminar item análisis'),
  });

  const generateScheduleMutation = useMutation({
    mutationFn: (mode: 'replace' | 'append') =>
      api.post(`/budget-versions/${versionId}/schedule/generate`, { mode }),
    onSuccess: (data: any) => {
      toast.success(
        `Cronograma generado: ${data.stagesCreated || 0} rubros/tareas`
      );
      setScheduleDialogOpen(false);
    },
    onError: (error: any) => toast.error(error.message || 'Error al generar cronograma'),
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded"></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!version) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">Version no encontrada</h2>
        <Link href={`/projects/${projectId}/budget-versions`}>
          <Button variant="link">Volver a versiones</Button>
        </Link>
      </div>
    );
  }

  const isDraft = version.status === 'DRAFT';
  const isApproved = version.status === 'APPROVED';
  const sortedCategories = [...version.categories].sort((a, b) => a.order - b.order);
  const totalStages = sortedCategories.reduce((sum, cat) => sum + cat.stages.length, 0);
  const totalItems = sortedCategories.reduce(
    (sum, cat) => sum + cat.stages.reduce((s, st) => s + st.items.length, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/budget-versions`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{version.code}</Badge>
              <Badge variant={getStatusVariant(version.status)}>
                {BUDGET_VERSION_STATUS_LABELS[
                  version.status as keyof typeof BUDGET_VERSION_STATUS_LABELS
                ] || version.status}
              </Badge>
              <Badge variant="outline">v{version.version}</Badge>
            </div>
            <h1 className="text-3xl font-bold">{version.name}</h1>
            {version.description && (
              <p className="text-muted-foreground mt-1">{version.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Button variant="outline" onClick={() => setEditVersionOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => recalculateMutation.mutate()}
                disabled={recalculateMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Recalcular K
              </Button>
              <Button onClick={() => setApproveDialogOpen(true)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            </>
          )}
          {isApproved && (
            <>
              <Button variant="outline" onClick={() => setScheduleDialogOpen(true)}>
                <CalendarClock className="mr-2 h-4 w-4" />
                Generar Cronograma
              </Button>
              <Button
                variant="outline"
                className="text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={() => revertToDraftMutation.mutate()}
                disabled={revertToDraftMutation.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Revertir a Borrador
              </Button>
            </>
          )}
        </div>
      </div>

      {/* K Coefficient Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coeficiente K</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Gastos Generales</p>
              <p className="text-xl font-bold">
                {(Number(version.gastosGeneralesPct) * 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Beneficio</p>
              <p className="text-xl font-bold">
                {(Number(version.beneficioPct) * 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gastos Financieros</p>
              <p className="text-xl font-bold">
                {(Number(version.gastosFinancierosPct) * 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">IVA</p>
              <p className="text-xl font-bold">
                {(Number(version.ivaPct) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-primary/10 rounded-lg p-2">
              <p className="text-sm text-muted-foreground">K</p>
              <p className="text-2xl font-bold text-primary">
                {Number(version.coeficienteK).toFixed(4)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Costo-Costo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(Number(version.totalCostoCosto), { compact: true })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Precio (con K)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(Number(version.totalPrecio), { compact: true })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rubros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sortedCategories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items / Items Análisis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStages} / {totalItems}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3-Level Hierarchy: Categories → Stages → Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Rubros, Items e Items Análisis</h2>
          {isDraft && (
            <Button onClick={() => setAddCategoryOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Rubro
            </Button>
          )}
        </div>

        {sortedCategories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No hay rubros en esta versión</p>
              {isDraft && (
                <Button onClick={() => setAddCategoryOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar primer rubro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          sortedCategories.map((category) => {
            const isCatExpanded = expandedCategories.has(category.id);
            const sortedStages = [...category.stages].sort((a, b) =>
              a.number.localeCompare(b.number, undefined, { numeric: true })
            );

            return (
              <Card key={category.id}>
                {/* Category Header (Level 1) */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3">
                    {isCatExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                    <div>
                      <h3 className="font-medium">
                        Rubro {category.number}: {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {sortedStages.length} items · Subtotal CC:{' '}
                        {formatCurrency(Number(category.subtotalCostoCosto), { compact: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isDraft && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAddStageCategoryId(category.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Item
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteCategoryId(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stages within Category (Level 2) */}
                {isCatExpanded && (
                  <CardContent className="p-0 pt-0">
                    {sortedStages.length === 0 ? (
                      <div className="px-6 py-4 text-center text-sm text-muted-foreground border-t">
                        Sin items en este rubro
                      </div>
                    ) : (
                      sortedStages.map((stage) => {
                        const isStageExpanded = expandedStages.has(stage.id);
                        const sortedItems = [...stage.items].sort((a, b) =>
                          a.number.localeCompare(b.number, undefined, { numeric: true })
                        );

                        return (
                          <div key={stage.id} className="border-t">
                            {/* Stage Header */}
                            <div
                              className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-muted/30 bg-muted/10"
                              onClick={() => toggleStage(stage.id)}
                            >
                              <div className="flex items-center gap-3">
                                {isStageExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <div>
                                  <span className="font-mono text-sm mr-2">{stage.number}</span>
                                  <span className="font-medium">{stage.description}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({stage.unit}) · {formatCurrency(Number(stage.totalPrice), { compact: true })}
                                    {' · '}
                                    {(Number(stage.incidencePct) * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                              <div
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isDraft && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => setAddItemStageId(stage.id)}
                                    >
                                      <Plus className="mr-1 h-3 w-3" />
                                      Item Análisis
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7"
                                      onClick={() =>
                                        setEditStage({ stage, categoryId: category.id })
                                      }
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-destructive"
                                      onClick={() => setDeleteStageId(stage.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Items within Stage (Level 3) */}
                            {isStageExpanded && (
                              <div className="px-4">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[80px]">Nro</TableHead>
                                      <TableHead>Descripcion</TableHead>
                                      <TableHead className="w-[80px]">Unidad</TableHead>
                                      <TableHead className="text-right w-[100px]">Cantidad</TableHead>
                                      <TableHead className="text-right w-[120px]">P.U. (CC)</TableHead>
                                      <TableHead className="text-right w-[140px]">Total (CC)</TableHead>
                                      <TableHead className="w-[80px]">APU</TableHead>
                                      {isDraft && <TableHead className="w-[80px]"></TableHead>}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sortedItems.length === 0 ? (
                                      <TableRow>
                                        <TableCell
                                          colSpan={isDraft ? 8 : 7}
                                          className="h-12 text-center text-muted-foreground text-sm"
                                        >
                                          Sin items análisis en este item
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      sortedItems.map((item) => (
                                        <TableRow key={item.id}>
                                          <TableCell className="font-mono text-sm">
                                            {item.number}
                                          </TableCell>
                                          <TableCell>{item.description}</TableCell>
                                          <TableCell className="text-center">{item.unit}</TableCell>
                                          <TableCell className="text-right font-mono">
                                            {Number(item.quantity).toLocaleString('es-AR', {
                                              maximumFractionDigits: 4,
                                            })}
                                          </TableCell>
                                          <TableCell className="text-right font-mono">
                                            {formatCurrency(Number(item.unitPrice))}
                                          </TableCell>
                                          <TableCell className="text-right font-mono font-medium">
                                            {formatCurrency(Number(item.totalPrice))}
                                          </TableCell>
                                          <TableCell>
                                            {item.priceAnalysis ? (
                                              <Link
                                                href={`/projects/${projectId}/budget-versions/${versionId}/apu/${item.id}`}
                                              >
                                                <Badge variant="default" className="cursor-pointer">
                                                  Ver APU
                                                </Badge>
                                              </Link>
                                            ) : (
                                              <Link
                                                href={`/projects/${projectId}/budget-versions/${versionId}/apu/${item.id}`}
                                              >
                                                <Badge variant="outline" className="cursor-pointer">
                                                  + APU
                                                </Badge>
                                              </Link>
                                            )}
                                          </TableCell>
                                          {isDraft && (
                                            <TableCell>
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  onClick={() =>
                                                    setEditItem({ item, stageId: stage.id })
                                                  }
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8 text-destructive"
                                                  onClick={() => setDeleteItemId(item.id)}
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          )}
                                        </TableRow>
                                      ))
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Version Dialog */}
      <Dialog open={editVersionOpen} onOpenChange={setEditVersionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Version</DialogTitle>
          </DialogHeader>
          <BudgetVersionForm
            projectId={projectId}
            initialData={{
              id: version.id,
              name: version.name,
              description: version.description || '',
              gastosGeneralesPct: Number(version.gastosGeneralesPct),
              beneficioPct: Number(version.beneficioPct),
              gastosFinancierosPct: Number(version.gastosFinancierosPct),
              ivaPct: Number(version.ivaPct),
              projectId,
            }}
            onSuccess={() => {
              setEditVersionOpen(false);
              invalidate();
              toast.success('Version actualizada');
            }}
            onCancel={() => setEditVersionOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Rubro</DialogTitle>
          </DialogHeader>
          <BudgetCategoryForm
            budgetVersionId={versionId}
            nextNumber={sortedCategories.length + 1}
            onSuccess={() => {
              setAddCategoryOpen(false);
              invalidate();
              toast.success('Rubro creado');
            }}
            onCancel={() => setAddCategoryOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Rubro</DialogTitle>
          </DialogHeader>
          {editCategory && (
            <BudgetCategoryForm
              budgetVersionId={versionId}
              initialData={{
                id: editCategory.id,
                number: editCategory.number,
                name: editCategory.name,
                description: editCategory.description || '',
                order: editCategory.order,
              }}
              onSuccess={() => {
                setEditCategory(null);
                invalidate();
                toast.success('Rubro actualizado');
              }}
              onCancel={() => setEditCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog open={!!addStageCategoryId} onOpenChange={() => setAddStageCategoryId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Item</DialogTitle>
          </DialogHeader>
          {addStageCategoryId && (
            <BudgetStageForm
              categoryId={addStageCategoryId}
              budgetVersionId={versionId}
              onSuccess={() => {
                setAddStageCategoryId(null);
                invalidate();
                toast.success('Item creado');
              }}
              onCancel={() => setAddStageCategoryId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Stage Dialog */}
      <Dialog open={!!editStage} onOpenChange={() => setEditStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          {editStage && (
            <BudgetStageForm
              categoryId={editStage.categoryId}
              budgetVersionId={versionId}
              initialData={{
                id: editStage.stage.id,
                number: editStage.stage.number,
                description: editStage.stage.description,
                unit: editStage.stage.unit,
                quantity: Number(editStage.stage.quantity),
                unitPrice: Number(editStage.stage.unitPrice),
              }}
              onSuccess={() => {
                setEditStage(null);
                invalidate();
                toast.success('Item actualizado');
              }}
              onCancel={() => setEditStage(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={!!addItemStageId} onOpenChange={() => setAddItemStageId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nuevo Item Análisis</DialogTitle>
          </DialogHeader>
          {addItemStageId && (
            <BudgetItemForm
              stageId={addItemStageId}
              budgetVersionId={versionId}
              onSuccess={() => {
                setAddItemStageId(null);
                invalidate();
                toast.success('Item Análisis creado');
              }}
              onCancel={() => setAddItemStageId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Item Análisis</DialogTitle>
          </DialogHeader>
          {editItem && (
            <BudgetItemForm
              stageId={editItem.stageId}
              budgetVersionId={versionId}
              initialData={{
                id: editItem.item.id,
                number: editItem.item.number,
                description: editItem.item.description,
                unit: editItem.item.unit,
                quantity: Number(editItem.item.quantity),
                unitPrice: Number(editItem.item.unitPrice),
              }}
              onSuccess={() => {
                setEditItem(null);
                invalidate();
                toast.success('Item Análisis actualizado');
              }}
              onCancel={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar Presupuesto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas aprobar esta versión del presupuesto? Una vez aprobada,
              no se podrá editar ni eliminar.
              <br /><br />
              Al aprobar se generará automáticamente el cronograma de obra (Rubros → Tareas)
              reemplazando el cronograma existente vinculado a este presupuesto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => approveMutation.mutate()}>
              {approveMutation.isPending ? 'Aprobando...' : 'Aprobar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Schedule Dialog */}
      <AlertDialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generar Cronograma</AlertDialogTitle>
            <AlertDialogDescription>
              Se generarán rubros y tareas del proyecto a partir de la estructura del presupuesto
              (Rubros → Tareas).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scheduleMode"
                value="replace"
                checked={scheduleMode === 'replace'}
                onChange={() => setScheduleMode('replace')}
              />
              <div>
                <span className="font-medium">Reemplazar</span>
                <p className="text-sm text-muted-foreground">
                  Elimina los rubros y tareas existentes y los reemplaza
                </p>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scheduleMode"
                value="append"
                checked={scheduleMode === 'append'}
                onChange={() => setScheduleMode('append')}
              />
              <div>
                <span className="font-medium">Agregar</span>
                <p className="text-sm text-muted-foreground">
                  Mantiene lo existente y agrega los nuevos rubros y tareas
                </p>
              </div>
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => generateScheduleMutation.mutate(scheduleMode)}
              disabled={generateScheduleMutation.isPending}
            >
              {generateScheduleMutation.isPending ? 'Generando...' : 'Generar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Rubro</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todos los items e items análisis del rubro. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCategoryId && deleteCategoryMutation.mutate(deleteCategoryId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Stage Confirmation */}
      <AlertDialog open={!!deleteStageId} onOpenChange={() => setDeleteStageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Item</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todos los items análisis de este item. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteStageId && deleteStageMutation.mutate(deleteStageId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Item Análisis</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteItemId && deleteItemMutation.mutate(deleteItemId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
