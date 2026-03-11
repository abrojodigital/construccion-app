'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  Pencil,
  CalendarRange,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Chart dinámico ───────────────────────────────────────────────────────────
const SCurvePlan = dynamic(
  () => import('@/components/charts/scurve-plan').then((m) => m.SCurvePlan),
  { ssr: false, loading: () => <div className="h-80 animate-pulse bg-muted rounded-lg" /> }
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
  project: { id: string; name: string; code: string };
  budgetVersion: { id: string; name: string; code: string };
  periods: FinancialPeriod[];
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  APPROVED: 'Aprobado',
  SUPERSEDED: 'Supersedido',
};

const STATUS_VARIANT: Record<string, 'secondary' | 'default' | 'outline'> = {
  DRAFT: 'secondary',
  APPROVED: 'default',
  SUPERSEDED: 'outline',
};

// ─── Form inicial de período ───────────────────────────────────────────────────

const EMPTY_PERIOD = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  projectedAmount: 0,
  projectedMaterials: 0,
  projectedLabor: 0,
  projectedEquipment: 0,
  projectedSubcontracts: 0,
  projectedProgress: 0,
  notes: '',
};

// ─── Componente: Dialog de período ───────────────────────────────────────────

function PeriodDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialData: typeof EMPTY_PERIOD;
  onSave: (data: typeof EMPTY_PERIOD) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState(initialData);

  // Sync cuando cambia initialData (para edición)
  const set = (key: keyof typeof EMPTY_PERIOD, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const otherSum =
    Number(form.projectedMaterials) +
    Number(form.projectedLabor) +
    Number(form.projectedEquipment) +
    Number(form.projectedSubcontracts);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData === EMPTY_PERIOD ? 'Agregar Período' : 'Editar Período'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Mes */}
          <div className="space-y-1.5">
            <Label>Mes</Label>
            <Select
              value={String(form.month)}
              onValueChange={(v) => set('month', Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Año */}
          <div className="space-y-1.5">
            <Label>Año</Label>
            <Input
              type="number"
              value={form.year}
              min={2020}
              max={2040}
              onChange={(e) => set('year', Number(e.target.value))}
            />
          </div>

          {/* Monto total proyectado */}
          <div className="space-y-1.5 col-span-2">
            <Label>Total Proyectado (ARS)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.projectedAmount}
              onChange={(e) => set('projectedAmount', Number(e.target.value))}
            />
            {otherSum > 0 && Number(form.projectedAmount) < otherSum && (
              <p className="text-xs text-amber-600">
                La suma de rubros ({formatCurrency(otherSum, { compact: true })}) supera el total
              </p>
            )}
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5">
            <Label>Materiales</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.projectedMaterials}
              onChange={(e) => set('projectedMaterials', Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Mano de Obra</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.projectedLabor}
              onChange={(e) => set('projectedLabor', Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Equipos</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.projectedEquipment}
              onChange={(e) => set('projectedEquipment', Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Subcontratos</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.projectedSubcontracts}
              onChange={(e) => set('projectedSubcontracts', Number(e.target.value))}
            />
          </div>

          {/* Avance planificado */}
          <div className="space-y-1.5 col-span-2">
            <Label>Avance Planificado (%)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={Number(form.projectedProgress) * 100}
                onChange={(e) =>
                  set('projectedProgress', Math.min(100, Math.max(0, Number(e.target.value))) / 100)
                }
              />
              <span className="text-sm text-muted-foreground w-16 text-right">
                {(Number(form.projectedProgress) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5 col-span-2">
            <Label>Notas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Observaciones del período"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={isPending || !form.projectedAmount}
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente: Generador masivo ─────────────────────────────────────────────

function BulkGeneratorDialog({
  open,
  onOpenChange,
  onGenerate,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGenerate: (periods: typeof EMPTY_PERIOD[]) => void;
  isPending: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const [startMonth, setStartMonth] = useState(1);
  const [startYear, setStartYear] = useState(currentYear);
  const [endMonth, setEndMonth] = useState(12);
  const [endYear, setEndYear] = useState(currentYear);
  const [totalAmount, setTotalAmount] = useState(0);
  const [distribution, setDistribution] = useState<'equal' | 'linear'>('equal');

  const numMonths = useMemo(() => {
    const start = startYear * 12 + startMonth - 1;
    const end = endYear * 12 + endMonth - 1;
    return Math.max(1, end - start + 1);
  }, [startMonth, startYear, endMonth, endYear]);

  const handleGenerate = () => {
    const periods: typeof EMPTY_PERIOD[] = [];
    for (let i = 0; i < numMonths; i++) {
      const totalMonths = startYear * 12 + startMonth - 1 + i;
      const month = (totalMonths % 12) + 1;
      const year = Math.floor(totalMonths / 12);
      const amount =
        distribution === 'equal'
          ? totalAmount / numMonths
          : (totalAmount * 2 * (i + 1)) / (numMonths * (numMonths + 1));
      periods.push({ ...EMPTY_PERIOD, month, year, projectedAmount: Math.round(amount * 100) / 100 });
    }
    onGenerate(periods);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Generar Períodos en Lote
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mes inicio</Label>
              <Select value={String(startMonth)} onValueChange={(v) => setStartMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((n, i) => <SelectItem key={i+1} value={String(i+1)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Año inicio</Label>
              <Input type="number" value={startYear} min={2020} max={2040} onChange={(e) => setStartYear(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>Mes fin</Label>
              <Select value={String(endMonth)} onValueChange={(v) => setEndMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((n, i) => <SelectItem key={i+1} value={String(i+1)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Año fin</Label>
              <Input type="number" value={endYear} min={2020} max={2040} onChange={(e) => setEndYear(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Monto Total a Distribuir (ARS)</Label>
            <Input
              type="number"
              step="1000"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Distribución</Label>
            <Select value={distribution} onValueChange={(v: any) => setDistribution(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Montos iguales por mes</SelectItem>
                <SelectItem value="linear">Curva lineal creciente (S)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            Se generarán <strong>{numMonths} período{numMonths !== 1 ? 's' : ''}</strong> con un
            promedio de{' '}
            <strong>{formatCurrency(numMonths > 0 ? totalAmount / numMonths : 0, { compact: true })}</strong>{' '}
            por mes
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleGenerate} disabled={isPending || totalAmount <= 0 || numMonths <= 0}>
            {isPending ? 'Generando...' : `Generar ${numMonths} períodos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function FinancialPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const planId = params.planId as string;
  const queryClient = useQueryClient();

  const [periodDialog, setPeriodDialog] = useState<{ open: boolean; editing: FinancialPeriod | null }>({ open: false, editing: null });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deletePeriodId, setDeletePeriodId] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);

  // ── Query ─────────────────────────────────────────────────────────────────────
  const { data: plan, isLoading } = useQuery({
    queryKey: ['financial-plan', planId],
    queryFn: () => api.get<FinancialPlan>(`/financial-plans/${planId}`),
  });

  const isDraft = plan?.status === 'DRAFT';

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['financial-plan', planId] });
    queryClient.invalidateQueries({ queryKey: ['financial-plans', projectId] });
  };

  const addPeriodMutation = useMutation({
    mutationFn: (data: typeof EMPTY_PERIOD) => api.post(`/financial-plans/${planId}/periods`, data),
    onSuccess: () => { invalidate(); setPeriodDialog({ open: false, editing: null }); toast.success('Período agregado'); },
    onError: (e: any) => toast.error(e.message || 'Error al agregar período'),
  });

  const updatePeriodMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof EMPTY_PERIOD> }) =>
      api.put(`/financial-plans/periods/${id}`, data),
    onSuccess: () => { invalidate(); setPeriodDialog({ open: false, editing: null }); toast.success('Período actualizado'); },
    onError: (e: any) => toast.error(e.message || 'Error al actualizar período'),
  });

  const deletePeriodMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/financial-plans/periods/${id}`),
    onSuccess: () => { invalidate(); setDeletePeriodId(null); toast.success('Período eliminado'); },
    onError: (e: any) => toast.error(e.message || 'Error al eliminar período'),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/financial-plans/${planId}/approve`),
    onSuccess: () => { invalidate(); setConfirmApprove(false); toast.success('Plan aprobado'); },
    onError: (e: any) => toast.error(e.message || 'Error al aprobar'),
  });

  // Bulk generation: sends one request per period sequentially
  const [bulkPending, setBulkPending] = useState(false);
  const handleBulkGenerate = async (periods: typeof EMPTY_PERIOD[]) => {
    setBulkPending(true);
    let errors = 0;
    for (const period of periods) {
      try {
        await api.post(`/financial-plans/${planId}/periods`, period);
      } catch {
        errors++;
      }
    }
    invalidate();
    setBulkPending(false);
    setBulkOpen(false);
    if (errors === 0) toast.success(`${periods.length} períodos generados`);
    else toast.warning(`${periods.length - errors} períodos generados, ${errors} errores (períodos duplicados omitidos)`);
  };

  // ── Datos derivados ───────────────────────────────────────────────────────────
  const periods = plan?.periods ?? [];

  const totals = useMemo(() => ({
    projected: periods.reduce((s, p) => s + Number(p.projectedAmount), 0),
    certified: periods.reduce((s, p) => s + Number(p.certifiedAmount), 0),
    executed: periods.reduce((s, p) => s + Number(p.executedAmount), 0),
    materials: periods.reduce((s, p) => s + Number(p.projectedMaterials), 0),
    labor: periods.reduce((s, p) => s + Number(p.projectedLabor), 0),
    equipment: periods.reduce((s, p) => s + Number(p.projectedEquipment), 0),
    subcontracts: periods.reduce((s, p) => s + Number(p.projectedSubcontracts), 0),
  }), [periods]);

  const sCurveData = useMemo(() => {
    let cumProjected = 0;
    let cumCertified = 0;
    return periods.map((p) => {
      cumProjected += Number(p.projectedAmount);
      const cert = Number(p.certifiedAmount);
      cumCertified += cert;
      return {
        label: p.label,
        proyectado: cumProjected,
        certificado: cert > 0 ? cumCertified : null,
      };
    });
  }, [periods]);

  const barData = useMemo(() =>
    periods.map((p) => ({
      label: p.label,
      Proyectado: Number(p.projectedAmount),
      Certificado: Number(p.certifiedAmount) || undefined,
      Ejecutado: Number(p.executedAmount) || undefined,
    })), [periods]);

  const arsFmt = (v: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', notation: 'compact', maximumFractionDigits: 1 }).format(v);

  // ── Loading ────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse bg-muted rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-16 animate-pulse bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Plan no encontrado</p>
        <Link href={`/projects/${projectId}/financial-plans`}>
          <Button variant="link">Volver</Button>
        </Link>
      </div>
    );
  }

  const periodInitial = periodDialog.editing
    ? {
        month: periodDialog.editing.month,
        year: periodDialog.editing.year,
        projectedAmount: Number(periodDialog.editing.projectedAmount),
        projectedMaterials: Number(periodDialog.editing.projectedMaterials),
        projectedLabor: Number(periodDialog.editing.projectedLabor),
        projectedEquipment: Number(periodDialog.editing.projectedEquipment),
        projectedSubcontracts: Number(periodDialog.editing.projectedSubcontracts),
        projectedProgress: Number(periodDialog.editing.projectedProgress),
        notes: periodDialog.editing.notes || '',
      }
    : EMPTY_PERIOD;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/financial-plans`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={STATUS_VARIANT[plan.status] ?? 'secondary'}>
                {STATUS_LABEL[plan.status] ?? plan.status}
              </Badge>
              <span className="text-muted-foreground text-sm">{plan.budgetVersion.code} — {plan.budgetVersion.name}</span>
            </div>
            <h1 className="text-2xl font-bold">{plan.name}</h1>
            <p className="text-sm text-muted-foreground">{plan.project.code} — {plan.project.name}</p>
          </div>
        </div>
        {isDraft && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <CalendarRange className="mr-2 h-4 w-4" />
              Generar períodos
            </Button>
            <Button variant="outline" onClick={() => setPeriodDialog({ open: true, editing: null })}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar período
            </Button>
            <Button onClick={() => setConfirmApprove(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprobar
            </Button>
          </div>
        )}
      </div>

      {/* Aviso si sin períodos */}
      {periods.length === 0 && isDraft && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm">
              Sin períodos. Usá <strong>Generar períodos</strong> para crear todos los meses de
              golpe, o <strong>Agregar período</strong> para cargar uno por uno.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tarjetas resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyectado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.projected, { compact: true })}</div>
            <p className="text-xs text-muted-foreground mt-1">{periods.length} períodos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certificado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totals.certified, { compact: true })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={totals.projected > 0 ? (totals.certified / totals.projected) * 100 : 0} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatPercentage(totals.projected > 0 ? totals.certified / totals.projected : 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ejecutado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totals.executed, { compact: true })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={totals.projected > 0 ? (totals.executed / totals.projected) * 100 : 0} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatPercentage(totals.projected > 0 ? totals.executed / totals.projected : 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Desglose Proyectado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-2">
            {[
              { label: 'Materiales', value: totals.materials },
              { label: 'Mano de Obra', value: totals.labor },
              { label: 'Equipos', value: totals.equipment },
              { label: 'Subcontratos', value: totals.subcontracts },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{r.label}</span>
                <span>{formatCurrency(r.value, { compact: true })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {periods.length > 1 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <CardTitle className="text-base">Curva S — Acumulado</CardTitle>
                  <CardDescription>Inversión acumulada planificada vs certificada</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SCurvePlan data={sCurveData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cash Flow Mensual</CardTitle>
              <CardDescription>Proyectado vs certificado vs ejecutado por período</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tickFormatter={arsFmt} tick={{ fontSize: 10 }} width={72} />
                  <Tooltip formatter={(v: number) => arsFmt(v)} labelFormatter={(l) => `Período: ${l}`} />
                  <Legend />
                  <Bar dataKey="Proyectado" fill="#6366f1" fillOpacity={0.85} radius={[3,3,0,0]} />
                  <Bar dataKey="Certificado" fill="#22c55e" fillOpacity={0.85} radius={[3,3,0,0]} />
                  <Bar dataKey="Ejecutado" fill="#f59e0b" fillOpacity={0.85} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de períodos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Períodos Mensuales</CardTitle>
            <CardDescription>
              {periods.length} período{periods.length !== 1 ? 's' : ''} cargado{periods.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Total Proy.</TableHead>
                  <TableHead className="text-right">Materiales</TableHead>
                  <TableHead className="text-right">MdO</TableHead>
                  <TableHead className="text-right">Equipos</TableHead>
                  <TableHead className="text-right">Subcontr.</TableHead>
                  <TableHead className="text-right text-emerald-600 dark:text-emerald-400">Certificado</TableHead>
                  <TableHead className="text-right text-amber-600 dark:text-amber-400">Ejecutado</TableHead>
                  <TableHead className="text-right">Av. Plan</TableHead>
                  <TableHead className="text-right">Av. Real</TableHead>
                  {isDraft && <TableHead className="w-[80px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isDraft ? 11 : 10} className="h-24 text-center text-muted-foreground">
                      Sin períodos. Agregá períodos al plan.
                    </TableCell>
                  </TableRow>
                ) : (
                  periods.map((p) => {
                    const behindSchedule =
                      Number(p.actualProgress) > 0 &&
                      Number(p.actualProgress) < Number(p.projectedProgress);
                    return (
                      <TableRow key={p.id} className="text-sm">
                        <TableCell className="font-medium">{p.label}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(p.projectedAmount), { compact: true })}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Number(p.projectedMaterials) > 0
                            ? formatCurrency(Number(p.projectedMaterials), { compact: true })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Number(p.projectedLabor) > 0
                            ? formatCurrency(Number(p.projectedLabor), { compact: true })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Number(p.projectedEquipment) > 0
                            ? formatCurrency(Number(p.projectedEquipment), { compact: true })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Number(p.projectedSubcontracts) > 0
                            ? formatCurrency(Number(p.projectedSubcontracts), { compact: true })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                          {Number(p.certifiedAmount) > 0
                            ? formatCurrency(Number(p.certifiedAmount), { compact: true })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right text-amber-600 dark:text-amber-400">
                          {Number(p.executedAmount) > 0
                            ? formatCurrency(Number(p.executedAmount), { compact: true })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPercentage(Number(p.projectedProgress))}
                        </TableCell>
                        <TableCell className={`text-right ${behindSchedule ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                          {Number(p.actualProgress) > 0
                            ? formatPercentage(Number(p.actualProgress))
                            : '—'}
                        </TableCell>
                        {isDraft && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setPeriodDialog({ open: true, editing: p })}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={() => setDeletePeriodId(p.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              {periods.length > 0 && (
                <tfoot>
                  <TableRow className="bg-muted/30 font-bold text-sm border-t-2">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.projected, { compact: true })}</TableCell>
                    <TableCell className="text-right">{totals.materials > 0 ? formatCurrency(totals.materials, { compact: true }) : '—'}</TableCell>
                    <TableCell className="text-right">{totals.labor > 0 ? formatCurrency(totals.labor, { compact: true }) : '—'}</TableCell>
                    <TableCell className="text-right">{totals.equipment > 0 ? formatCurrency(totals.equipment, { compact: true }) : '—'}</TableCell>
                    <TableCell className="text-right">{totals.subcontracts > 0 ? formatCurrency(totals.subcontracts, { compact: true }) : '—'}</TableCell>
                    <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{totals.certified > 0 ? formatCurrency(totals.certified, { compact: true }) : '—'}</TableCell>
                    <TableCell className="text-right text-amber-600 dark:text-amber-400">{totals.executed > 0 ? formatCurrency(totals.executed, { compact: true }) : '—'}</TableCell>
                    <TableCell colSpan={isDraft ? 3 : 2} />
                  </TableRow>
                </tfoot>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog agregar/editar período */}
      <PeriodDialog
        open={periodDialog.open}
        onOpenChange={(v) => { if (!v) setPeriodDialog({ open: false, editing: null }); }}
        initialData={periodInitial}
        onSave={(data) => {
          if (periodDialog.editing) {
            updatePeriodMutation.mutate({ id: periodDialog.editing.id, data });
          } else {
            addPeriodMutation.mutate(data);
          }
        }}
        isPending={addPeriodMutation.isPending || updatePeriodMutation.isPending}
      />

      {/* Dialog generador masivo */}
      <BulkGeneratorDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onGenerate={handleBulkGenerate}
        isPending={bulkPending}
      />

      {/* Confirmar eliminar período */}
      <AlertDialog open={!!deletePeriodId} onOpenChange={(v) => { if (!v) setDeletePeriodId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Período</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar este período del plan? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePeriodId && deletePeriodMutation.mutate(deletePeriodId)}
            >
              {deletePeriodMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar aprobar plan */}
      <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar Plan Financiero</AlertDialogTitle>
            <AlertDialogDescription>
              Al aprobar el plan no se podrán modificar ni eliminar los períodos.
              El plan quedará como referencia histórica del cash flow planificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => approveMutation.mutate()}>
              {approveMutation.isPending ? 'Aprobando...' : 'Aprobar Plan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
