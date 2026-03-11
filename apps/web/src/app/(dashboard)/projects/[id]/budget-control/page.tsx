'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/utils';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface BudgetItem {
  id: string;
  number: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  certificado: number;
  gastado: number;
  avanceFisico: number;
  porcentajeCertificado: number;
  porcentajeGastado: number;
}

interface BudgetStage {
  id: string;
  number: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  incidencePct: number;
  certificado: number;
  gastado: number;
  avanceFisico: number;
  items: BudgetItem[];
}

interface BudgetCategory {
  id: string;
  number: number;
  name: string;
  subtotalCostoCosto: number;
  certificado: number;
  gastado: number;
  avanceFisico: number;
  stages: BudgetStage[];
}

interface Certificate {
  id: string;
  code: string;
  number: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  subtotal: number;
  acopioAmount: number;
  anticipoAmount: number;
  fondoReparoAmount: number;
  ivaAmount: number;
  totalAmount: number;
}

interface BudgetControlData {
  project: { id: string; code: string; name: string };
  budgetVersion: {
    id: string;
    code: string;
    name: string;
    version: number;
    status: string;
    coeficienteK: number;
    totalCostoCosto: number;
    totalPrecio: number;
  } | null;
  summary: {
    presupuesto: number;
    presupuestoCostoCosto: number | null;
    gastado: number;
    certificadoSubtotal: number;
    certificadoTotal: number;
    variacionGasto: number;
    porcentajeGastado: number;
    porcentajeCertificado: number;
  };
  categories: BudgetCategory[];
  gastosPorCategoria: { categoria: string; monto: number; cantidad: number }[];
  certificados: Certificate[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CERT_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Borrador',
  SUBMITTED: 'Presentado',
  APPROVED: 'Aprobado',
  PAID: 'Pagado',
};

const CERT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  DRAFT: 'secondary',
  SUBMITTED: 'warning',
  APPROVED: 'default',
  PAID: 'success',
};

function VarianceIndicator({ value, pct }: { value: number; pct: number }) {
  if (Math.abs(pct) < 0.01) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-xs">
        <Minus className="h-3 w-3" />
        {formatCurrency(value, { compact: true })}
      </span>
    );
  }
  if (value >= 0) {
    return (
      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
        <TrendingUp className="h-3 w-3" />
        {formatCurrency(value, { compact: true })}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium">
      <TrendingDown className="h-3 w-3" />
      {formatCurrency(value, { compact: true })}
    </span>
  );
}

// ─── Fila de ítem ─────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: BudgetItem }) {
  const certOverrun = item.certificado > item.totalPrice;
  const gastoOverrun = item.gastado > item.totalPrice;
  const hasGasto = item.gastado > 0;
  return (
    <tr className="border-b hover:bg-muted/30 text-xs">
      <td className="px-3 py-2 text-muted-foreground pl-10">{item.number}</td>
      <td className="px-3 py-2 max-w-[200px] truncate">{item.description}</td>
      <td className="px-3 py-2 text-right">{item.unit}</td>
      <td className="px-3 py-2 text-right">{item.quantity.toLocaleString('es-AR')}</td>
      <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice, { compact: true })}</td>
      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.totalPrice, { compact: true })}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex flex-col items-end gap-1">
          <span className={certOverrun ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            {formatCurrency(item.certificado, { compact: true })}
          </span>
          <Progress value={item.porcentajeCertificado * 100} className="h-1 w-16" />
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        {hasGasto ? (
          <div className="flex flex-col items-end gap-1">
            <span className={gastoOverrun ? 'text-red-600 dark:text-red-400 font-medium' : 'text-amber-600 dark:text-amber-400'}>
              {formatCurrency(item.gastado, { compact: true })}
            </span>
            <Progress value={item.porcentajeGastado * 100} className="h-1 w-16" />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex flex-col items-end gap-1">
          <span>{formatPercentage(item.avanceFisico)}</span>
          <Progress value={item.avanceFisico * 100} className="h-1 w-16" />
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <VarianceIndicator
          value={item.certificado - item.totalPrice}
          pct={(item.certificado - item.totalPrice) / (item.totalPrice || 1)}
        />
      </td>
    </tr>
  );
}

// ─── Fila de etapa ────────────────────────────────────────────────────────────

function StageRow({ stage }: { stage: BudgetStage }) {
  const [open, setOpen] = useState(false);
  const certOverrun = stage.certificado > stage.totalPrice;
  const gastoOverrun = stage.gastado > stage.totalPrice;
  return (
    <>
      <tr
        className="border-b bg-muted/20 hover:bg-muted/40 cursor-pointer text-sm"
        onClick={() => setOpen(!open)}
      >
        <td className="px-3 py-2 pl-6">
          <div className="flex items-center gap-1 text-muted-foreground">
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {stage.number}
          </div>
        </td>
        <td className="px-3 py-2 font-medium">{stage.description}</td>
        <td className="px-3 py-2 text-right text-muted-foreground">{stage.unit}</td>
        <td className="px-3 py-2 text-right text-muted-foreground">
          {stage.quantity.toLocaleString('es-AR')}
        </td>
        <td className="px-3 py-2 text-right text-muted-foreground">
          {formatCurrency(stage.unitPrice, { compact: true })}
        </td>
        <td className="px-3 py-2 text-right font-semibold">
          {formatCurrency(stage.totalPrice, { compact: true })}
          <div className="text-xs text-muted-foreground font-normal">
            {formatPercentage(stage.incidencePct)} del total
          </div>
        </td>
        <td className="px-3 py-2 text-right">
          <div className="flex flex-col items-end gap-1">
            <span className={certOverrun ? 'text-red-600 dark:text-red-400 font-semibold' : 'font-semibold'}>
              {formatCurrency(stage.certificado, { compact: true })}
            </span>
            <Progress
              value={stage.totalPrice > 0 ? (stage.certificado / stage.totalPrice) * 100 : 0}
              className="h-1.5 w-20"
            />
          </div>
        </td>
        <td className="px-3 py-2 text-right">
          {stage.gastado > 0 ? (
            <div className="flex flex-col items-end gap-1">
              <span className={gastoOverrun ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                {formatCurrency(stage.gastado, { compact: true })}
              </span>
              <Progress
                value={stage.totalPrice > 0 ? (stage.gastado / stage.totalPrice) * 100 : 0}
                className="h-1.5 w-20"
              />
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </td>
        <td className="px-3 py-2 text-right">
          <div className="flex flex-col items-end gap-1">
            <span className="font-semibold">{formatPercentage(stage.avanceFisico)}</span>
            <Progress value={stage.avanceFisico * 100} className="h-1.5 w-20" />
          </div>
        </td>
        <td className="px-3 py-2 text-right">
          <VarianceIndicator
            value={stage.certificado - stage.totalPrice}
            pct={(stage.certificado - stage.totalPrice) / (stage.totalPrice || 1)}
          />
        </td>
      </tr>
      {open &&
        stage.items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
    </>
  );
}

// ─── Fila de categoría ────────────────────────────────────────────────────────

function CategoryRow({ category }: { category: BudgetCategory }) {
  const [open, setOpen] = useState(true);
  const certOverrun = category.certificado > category.subtotalCostoCosto;
  const gastoOverrun = category.gastado > category.subtotalCostoCosto;
  return (
    <>
      <tr
        className="border-b bg-primary/5 hover:bg-primary/10 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <td className="px-3 py-3" colSpan={1}>
          <div className="flex items-center gap-2 font-bold text-sm">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Cap. {category.number}
          </div>
        </td>
        <td className="px-3 py-3 font-bold text-sm" colSpan={4}>
          {category.name}
        </td>
        <td className="px-3 py-3 text-right font-bold">
          {formatCurrency(category.subtotalCostoCosto, { compact: true })}
        </td>
        <td className="px-3 py-3 text-right">
          <div className="flex flex-col items-end gap-1">
            <span className={`font-bold ${certOverrun ? 'text-red-600 dark:text-red-400' : ''}`}>
              {formatCurrency(category.certificado, { compact: true })}
            </span>
            <Progress
              value={
                category.subtotalCostoCosto > 0
                  ? (category.certificado / category.subtotalCostoCosto) * 100
                  : 0
              }
              className="h-2 w-24"
            />
          </div>
        </td>
        <td className="px-3 py-3 text-right">
          {category.gastado > 0 ? (
            <div className="flex flex-col items-end gap-1">
              <span className={`font-bold ${gastoOverrun ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {formatCurrency(category.gastado, { compact: true })}
              </span>
              <Progress
                value={category.subtotalCostoCosto > 0 ? (category.gastado / category.subtotalCostoCosto) * 100 : 0}
                className="h-2 w-24"
              />
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </td>
        <td className="px-3 py-3 text-right">
          <div className="flex flex-col items-end gap-1">
            <span className="font-bold">{formatPercentage(category.avanceFisico)}</span>
            <Progress value={category.avanceFisico * 100} className="h-2 w-24" />
          </div>
        </td>
        <td className="px-3 py-3 text-right">
          <VarianceIndicator
            value={category.certificado - category.subtotalCostoCosto}
            pct={(category.certificado - category.subtotalCostoCosto) / (category.subtotalCostoCosto || 1)}
          />
        </td>
      </tr>
      {open &&
        category.stages.map((stage) => (
          <StageRow key={stage.id} stage={stage} />
        ))}
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function BudgetControlPage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['budget-control', projectId],
    queryFn: () => api.get<BudgetControlData>(`/reports/projects/${projectId}/budget-control`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse bg-muted rounded" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error al cargar el control presupuestario.</p>
        <Link href={`/projects/${projectId}`}>
          <Button variant="link">Volver al proyecto</Button>
        </Link>
      </div>
    );
  }

  const { summary, budgetVersion, categories, gastosPorCategoria, certificados } = data;
  const maxGasto = Math.max(...gastosPorCategoria.map((g) => g.monto), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Control Presupuestario</h1>
          <p className="text-muted-foreground text-sm">
            {data.project.code} — {data.project.name}
          </p>
        </div>
        {budgetVersion && (
          <Badge variant="outline" className="ml-auto">
            {budgetVersion.code} · K={budgetVersion.coeficienteK.toFixed(4)}
          </Badge>
        )}
      </div>

      {!budgetVersion && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm">
              No hay un presupuesto aprobado. Los montos presupuestados muestran el{' '}
              <strong>presupuesto estimado</strong> del proyecto.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tarjetas resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.presupuesto, { compact: true })}</div>
            {summary.presupuestoCostoCosto != null && (
              <p className="text-xs text-muted-foreground mt-1">
                Costo-costo: {formatCurrency(summary.presupuestoCostoCosto, { compact: true })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gastado Real</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.gastado, { compact: true })}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={summary.porcentajeGastado * 100} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatPercentage(summary.porcentajeGastado)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certificado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.certificadoSubtotal, { compact: true })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={summary.porcentajeCertificado * 100} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatPercentage(summary.porcentajeCertificado)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Neto c/ded: {formatCurrency(summary.certificadoTotal, { compact: true })}
            </p>
          </CardContent>
        </Card>

        <Card className={summary.variacionGasto >= 0 ? '' : 'border-red-500/50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Variación Presup. vs Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.variacionGasto >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {summary.variacionGasto >= 0 ? '+' : ''}
              {formatCurrency(summary.variacionGasto, { compact: true })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.variacionGasto >= 0 ? 'Dentro del presupuesto' : 'Excedido'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla jerárquica presupuesto vs certificado */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presupuesto vs Certificado por Capítulo</CardTitle>
            <p className="text-xs text-muted-foreground">
              Clic en capítulo o etapa para expandir ítems
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left w-20">N°</th>
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-right w-12">Ud.</th>
                    <th className="px-3 py-2 text-right w-20">Cant.</th>
                    <th className="px-3 py-2 text-right w-24">P. Unit.</th>
                    <th className="px-3 py-2 text-right w-28">Presupuesto</th>
                    <th className="px-3 py-2 text-right w-32">Certificado</th>
                    <th className="px-3 py-2 text-right w-28 text-amber-600 dark:text-amber-400">Gastado Real</th>
                    <th className="px-3 py-2 text-right w-28">Av. Físico</th>
                    <th className="px-3 py-2 text-right w-28">Variación</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <CategoryRow key={cat.id} category={cat} />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/30 font-bold text-sm">
                    <td className="px-3 py-3" colSpan={5}>TOTAL</td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(summary.presupuesto, { compact: true })}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(summary.certificadoSubtotal, { compact: true })}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-600 dark:text-amber-400">
                      {formatCurrency(summary.gastado, { compact: true })}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatPercentage(summary.porcentajeCertificado)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <VarianceIndicator
                        value={summary.certificadoSubtotal - summary.presupuesto}
                        pct={(summary.certificadoSubtotal - summary.presupuesto) / (summary.presupuesto || 1)}
                      />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gastos por categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gastos Reales por Categoría</CardTitle>
            <p className="text-xs text-muted-foreground">
              Gastos aprobados y pagados · Total:{' '}
              {formatCurrency(summary.gastado, { compact: true })}
            </p>
          </CardHeader>
          <CardContent>
            {gastosPorCategoria.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sin gastos registrados</p>
            ) : (
              <div className="space-y-3">
                {gastosPorCategoria
                  .sort((a, b) => b.monto - a.monto)
                  .map((g) => (
                    <div key={g.categoria}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="truncate">{g.categoria}</span>
                        <span className="font-medium ml-2 shrink-0">
                          {formatCurrency(g.monto, { compact: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={(g.monto / maxGasto) * 100} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {g.cantidad}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historial de certificados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Certificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {certificados.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sin certificados emitidos
              </p>
            ) : (
              <div className="space-y-2">
                {certificados.map((cert) => (
                  <Link
                    key={cert.id}
                    href={`/projects/${projectId}/certificates/${cert.id}`}
                    className="block"
                  >
                    <div className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cert.code}</span>
                          <Badge variant={CERT_STATUS_VARIANT[cert.status] ?? 'secondary'}>
                            {CERT_STATUS_LABEL[cert.status] ?? cert.status}
                          </Badge>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatCurrency(cert.subtotal, { compact: true })}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {formatDate(cert.periodStart)} — {formatDate(cert.periodEnd)}
                        </span>
                        <span>
                          Neto: {formatCurrency(cert.totalAmount, { compact: true })}
                        </span>
                      </div>
                      {(cert.acopioAmount + cert.anticipoAmount + cert.fondoReparoAmount) > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Ded.: {formatCurrency(cert.acopioAmount + cert.anticipoAmount + cert.fondoReparoAmount, { compact: true })}
                          {cert.ivaAmount > 0 && ` · IVA: ${formatCurrency(cert.ivaAmount, { compact: true })}`}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
