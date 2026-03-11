'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Trash2,
  Eye,
  CheckCircle,
  Banknote,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

const SCurvePlan = dynamic(
  () => import('@/components/charts/scurve-plan').then((m) => m.SCurvePlan),
  { ssr: false, loading: () => <div className="h-80 animate-pulse bg-muted rounded-lg" /> }
);
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Interfaces
interface FinancialPeriod {
  id: string;
  month: number;
  year: number;
  label: string;
  projectedAmount: string;
  projectedMaterials: string;
  projectedLabor: string;
  projectedEquipment: string;
  projectedSubcontracts: string;
  certifiedAmount: string;
  executedAmount: string;
  projectedProgress: string;
  actualProgress: string;
  notes: string | null;
}

interface FinancialPlan {
  id: string;
  name: string;
  status: string;
  projectId: string;
  project: { id: string; name: string; code?: string };
  budgetVersion: { id: string; name: string; code: string };
  periods?: FinancialPeriod[];
  _count?: { periods: number };
  createdAt: string;
}

interface BudgetVersion {
  id: string;
  name: string;
  code: string;
  status: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Borrador', variant: 'secondary' },
  APPROVED: { label: 'Aprobado', variant: 'default' },
  SUPERSEDED: { label: 'Superado', variant: 'outline' },
};

export default function FinancialPlansPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FinancialPlan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanBudgetId, setNewPlanBudgetId] = useState('');
  const [addPeriodOpen, setAddPeriodOpen] = useState(false);
  const [periodMonth, setPeriodMonth] = useState(1);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodAmount, setPeriodAmount] = useState(0);

  // Queries
  const { data: plans, isLoading } = useQuery({
    queryKey: ['financial-plans', projectId],
    queryFn: () =>
      api.get<FinancialPlan[]>(`/projects/${projectId}/financial-plans`),
  });

  const { data: budgetVersionsRes } = useQuery({
    queryKey: ['budget-versions', projectId],
    queryFn: () =>
      api.get<{ data: BudgetVersion[] }>(`/projects/${projectId}/budget-versions`),
  });
  const budgetVersions = budgetVersionsRes?.data;

  const { data: planDetail } = useQuery({
    queryKey: ['financial-plan-detail', selectedPlan?.id],
    queryFn: () =>
      api.get<FinancialPlan>(`/financial-plans/${selectedPlan!.id}`),
    enabled: !!selectedPlan,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { name: string; budgetVersionId: string }) =>
      api.post(`/projects/${projectId}/financial-plans`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-plans'] });
      toast.success('Plan financiero creado');
      setCreateOpen(false);
      setNewPlanName('');
      setNewPlanBudgetId('');
    },
    onError: (error: any) => toast.error(error.message || 'Error al crear'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/financial-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-plans'] });
      toast.success('Plan eliminado');
      setDeleteId(null);
      setSelectedPlan(null);
    },
    onError: (error: any) => toast.error(error.message || 'Error al eliminar'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/financial-plans/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-plans'] });
      queryClient.invalidateQueries({ queryKey: ['financial-plan-detail'] });
      toast.success('Plan aprobado');
    },
    onError: (error: any) => toast.error(error.message || 'Error al aprobar'),
  });

  const addPeriodMutation = useMutation({
    mutationFn: (data: { month: number; year: number; projectedAmount: number }) =>
      api.post(`/financial-plans/${selectedPlan!.id}/periods`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-plan-detail'] });
      queryClient.invalidateQueries({ queryKey: ['financial-plans'] });
      toast.success('Período agregado');
      setAddPeriodOpen(false);
    },
    onError: (error: any) => toast.error(error.message || 'Error al agregar período'),
  });

  const deletePeriodMutation = useMutation({
    mutationFn: (periodId: string) =>
      api.delete(`/financial-plans/periods/${periodId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-plan-detail'] });
      queryClient.invalidateQueries({ queryKey: ['financial-plans'] });
      toast.success('Período eliminado');
    },
    onError: (error: any) => toast.error(error.message || 'Error al eliminar período'),
  });

  // S-curve data (computed unconditionally to respect hooks rules)
  const sCurveData = useMemo(() => {
    if (!planDetail?.periods?.length) return [];
    let cumProjected = 0;
    let cumCertified = 0;
    return planDetail.periods.map((p) => {
      cumProjected += Number(p.projectedAmount);
      const rawCertified = Number(p.certifiedAmount);
      cumCertified += rawCertified;
      return {
        label: p.label,
        proyectado: cumProjected,
        certificado: rawCertified > 0 ? cumCertified : null,
      };
    });
  }, [planDetail?.periods]);

  // Vista detalle de un plan
  if (selectedPlan && planDetail) {
    const detail = planDetail;
    const totalProjected = detail.periods?.reduce(
      (sum, p) => sum + Number(p.projectedAmount),
      0
    ) ?? 0;
    const totalCertified = detail.periods?.reduce(
      (sum, p) => sum + Number(p.certifiedAmount),
      0
    ) ?? 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPlan(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{detail.name}</h1>
              <Badge variant={STATUS_MAP[detail.status]?.variant ?? 'secondary'}>
                {STATUS_MAP[detail.status]?.label ?? detail.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Presupuesto: {detail.budgetVersion.code} — {detail.budgetVersion.name}
            </p>
          </div>
          {detail.status === 'DRAFT' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddPeriodOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Período
              </Button>
              <Button onClick={() => approveMutation.mutate(detail.id)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Proyectado</p>
              <p className="text-2xl font-bold">{formatCurrency(totalProjected, { compact: true })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Certificado</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalCertified, { compact: true })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Períodos</p>
              <p className="text-2xl font-bold">{detail.periods?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* S-curve */}
        {sCurveData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Curva de Inversión (Curva S)</CardTitle>
                  <CardDescription>Inversión acumulada planificada vs certificada</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SCurvePlan data={sCurveData} />
            </CardContent>
          </Card>
        )}

        {/* Periods Table */}
        <Card>
          <CardHeader>
            <CardTitle>Períodos Mensuales</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Proyectado</TableHead>
                  <TableHead className="text-right">Materiales</TableHead>
                  <TableHead className="text-right">MdO</TableHead>
                  <TableHead className="text-right">Equipos</TableHead>
                  <TableHead className="text-right">Certificado</TableHead>
                  <TableHead className="text-right">Avance Plan</TableHead>
                  <TableHead className="text-right">Avance Real</TableHead>
                  {detail.status === 'DRAFT' && <TableHead className="w-[50px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!detail.periods?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={detail.status === 'DRAFT' ? 9 : 8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay períodos. Agregue períodos mensuales al plan.
                    </TableCell>
                  </TableRow>
                ) : (
                  detail.periods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">{period.label}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(period.projectedAmount), { compact: true })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(Number(period.projectedMaterials), { compact: true })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(Number(period.projectedLabor), { compact: true })}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(Number(period.projectedEquipment), { compact: true })}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(Number(period.certifiedAmount), { compact: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPercentage(Number(period.projectedProgress))}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(period.actualProgress) > 0 ? (
                          <span
                            className={
                              Number(period.actualProgress) >= Number(period.projectedProgress)
                                ? 'text-green-600'
                                : 'text-red-600'
                            }
                          >
                            {formatPercentage(Number(period.actualProgress))}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      {detail.status === 'DRAFT' && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePeriodMutation.mutate(period.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Period Dialog */}
        <Dialog open={addPeriodOpen} onOpenChange={setAddPeriodOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Período</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mes</Label>
                  <Select
                    value={String(periodMonth)}
                    onValueChange={(v) => setPeriodMonth(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
                      ].map((name, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Año</Label>
                  <Input
                    type="number"
                    value={periodYear}
                    onChange={(e) => setPeriodYear(Number(e.target.value))}
                    min={2020}
                    max={2040}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Monto Proyectado (ARS)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={periodAmount}
                  onChange={(e) => setPeriodAmount(Number(e.target.value))}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() =>
                    addPeriodMutation.mutate({
                      month: periodMonth,
                      year: periodYear,
                      projectedAmount: periodAmount,
                    })
                  }
                  disabled={addPeriodMutation.isPending}
                >
                  {addPeriodMutation.isPending ? 'Agregando...' : 'Agregar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista listado de planes
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Planes Financieros</h1>
          <p className="text-muted-foreground">Cash flow mensual del proyecto</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !plans?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Banknote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin planes financieros</h3>
            <p className="text-muted-foreground mb-4">
              Cree un plan financiero para proyectar el flujo de caja mensual
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <Link
                  href={`/projects/${projectId}/financial-plans/${plan.id}`}
                  className="flex-1"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-medium">{plan.name}</h3>
                    <Badge variant={STATUS_MAP[plan.status]?.variant ?? 'secondary'}>
                      {STATUS_MAP[plan.status]?.label ?? plan.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Presupuesto: {plan.budgetVersion.code} · {plan._count?.periods ?? 0} períodos
                  </p>
                </Link>
                <div className="flex items-center gap-1">
                  {plan.status === 'DRAFT' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Plan Financiero</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Plan</Label>
              <Input
                placeholder="Plan Financiero 2025"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Versión de Presupuesto</Label>
              <Select value={newPlanBudgetId} onValueChange={setNewPlanBudgetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar presupuesto" />
                </SelectTrigger>
                <SelectContent>
                  {budgetVersions?.map((bv) => (
                    <SelectItem key={bv.id} value={bv.id}>
                      {bv.code} — {bv.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() =>
                  createMutation.mutate({
                    name: newPlanName,
                    budgetVersionId: newPlanBudgetId,
                  })
                }
                disabled={!newPlanName || !newPlanBudgetId || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creando...' : 'Crear Plan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar plan financiero</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro? Se eliminarán todos los períodos asociados.
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
