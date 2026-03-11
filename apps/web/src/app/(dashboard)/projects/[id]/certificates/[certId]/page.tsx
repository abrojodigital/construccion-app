'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  FileText,
  Download,
  DollarSign,
  Printer,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CERTIFICATE_STATUS_LABELS,
  CERTIFICATE_STATUS_COLORS,
} from '@construccion/shared/constants';
import { useAuthStore } from '@/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type CertificateStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID';

interface CertificateItem {
  id: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  previousAdvance: string;
  previousAmount: string;
  currentAdvance: string;
  currentAmount: string;
  totalAdvance: string;
  totalAmount: string;
  budgetItemId: string;
}

interface CertificateDetail {
  id: string;
  code: string;
  number: number;
  status: CertificateStatus;
  periodStart: string;
  periodEnd: string;
  subtotal: string;
  acopioPct: string;
  acopioAmount: string;
  anticipoPct: string;
  anticipoAmount: string;
  fondoReparoPct: string;
  fondoReparoAmount: string;
  adjustmentFactor: string;
  ivaPct: string;
  ivaAmount: string;
  totalAmount: string;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  items: CertificateItem[];
  budgetVersion?: { id: string; name: string; code: string };
  project?: { id: string; code: string; name: string };
}

const statusBadgeVariant = (color: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    gray: 'secondary', yellow: 'outline', green: 'default', blue: 'default',
  };
  return map[color] || 'secondary';
};

// Agrupa ítems por etapa (primeros 2 segmentos del número: "1.1", "1.2", etc.)
function groupItemsByStage(items: CertificateItem[]) {
  const groups = new Map<string, CertificateItem[]>();
  for (const item of items) {
    const key = item.itemNumber.split('.').slice(0, 2).join('.');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

export default function CertificateDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const certId = params.certId as string;

  const [confirmAction, setConfirmAction] = useState<'submit' | 'approve' | 'paid' | null>(null);
  const [editingFactor, setEditingFactor] = useState(false);
  const [factorValue, setFactorValue] = useState('');
  const accessToken = useAuthStore((s) => s.accessToken);

  const { data: certificate, isLoading } = useQuery({
    queryKey: ['certificate', certId],
    queryFn: () => api.get<CertificateDetail>(`/certificates/${certId}`),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['certificate', certId] });
    queryClient.invalidateQueries({ queryKey: ['certificates', projectId] });
  };

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, currentAdvance }: { itemId: string; currentAdvance: number }) =>
      api.put(`/certificates/${certId}/items/${itemId}`, { currentAdvance }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['certificate', certId] }),
    onError: (error: any) => {
      const msg = error?.response?.data?.error?.message || 'Error al actualizar avance';
      toast.error(msg);
    },
  });

  const updateFactorMutation = useMutation({
    mutationFn: (adjustmentFactor: number) =>
      api.put(`/certificates/${certId}`, { adjustmentFactor }),
    onSuccess: () => {
      invalidate();
      setEditingFactor(false);
      toast.success('Factor de ajuste actualizado');
    },
    onError: () => toast.error('Error al actualizar el factor'),
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/certificates/${certId}/submit`),
    onSuccess: () => { invalidate(); toast.success('Certificado enviado para aprobación'); setConfirmAction(null); },
    onError: () => toast.error('Error al enviar certificado'),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/certificates/${certId}/approve`),
    onSuccess: () => { invalidate(); toast.success('Certificado aprobado'); setConfirmAction(null); },
    onError: () => toast.error('Error al aprobar certificado'),
  });

  const markPaidMutation = useMutation({
    mutationFn: () => api.post(`/certificates/${certId}/mark-paid`),
    onSuccess: () => { invalidate(); toast.success('Certificado marcado como pagado'); setConfirmAction(null); },
    onError: () => toast.error('Error al marcar como pagado'),
  });

  // Exports usando fetch directo (respuestas no-JSON)
  const handleExportPdf = async () => {
    try {
      const res = await fetch(`${API_URL}/certificates/${certId}/export/pdf`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      toast.error('Error al generar PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetch(`${API_URL}/certificates/${certId}/export/excel`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${certificate?.code || certId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al generar Excel');
    }
  };

  const handleAdvanceChange = (itemId: string, pctValue: string, previousAdvance: string) => {
    const pct = parseFloat(pctValue);
    if (isNaN(pct) || pct < 0) return;
    const maxPct = (1 - Number(previousAdvance)) * 100;
    const clamped = Math.min(pct, maxPct);
    updateItemMutation.mutate({ itemId, currentAdvance: clamped / 100 });
  };

  const handleSaveFactor = () => {
    const val = parseFloat(factorValue);
    if (isNaN(val) || val <= 0) {
      toast.error('El factor debe ser un número mayor a 0');
      return;
    }
    updateFactorMutation.mutate(val);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="h-32 animate-pulse bg-muted rounded" />
        <div className="h-64 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-medium">Certificado no encontrado</h2>
      </div>
    );
  }

  const isDraft = certificate.status === 'DRAFT';
  const isSubmitted = certificate.status === 'SUBMITTED';
  const isApproved = certificate.status === 'APPROVED';
  const statusColor = CERTIFICATE_STATUS_COLORS[certificate.status] || 'gray';
  const statusLabel = CERTIFICATE_STATUS_LABELS[certificate.status] || certificate.status;

  const subtotal = Number(certificate.subtotal);
  const acopioPct = Number(certificate.acopioPct);
  const acopioAmount = Number(certificate.acopioAmount);
  const anticipoAmount = Number(certificate.anticipoAmount);
  const fondoReparoAmount = Number(certificate.fondoReparoAmount);
  const adjustmentFactor = Number(certificate.adjustmentFactor);
  const ivaAmount = Number(certificate.ivaAmount);
  const totalAmount = Number(certificate.totalAmount);
  const netBeforeAdj = subtotal - acopioAmount - anticipoAmount - fondoReparoAmount;
  const netAdj = netBeforeAdj * adjustmentFactor;

  const stageGroups = groupItemsByStage(certificate.items);

  const confirmMessages: Record<string, { title: string; desc: string }> = {
    submit: {
      title: 'Presentar Certificado',
      desc: 'Una vez presentado, el certificado no podrá ser editado. ¿Desea continuar?',
    },
    approve: {
      title: 'Aprobar Certificado',
      desc: 'Al aprobar se confirman los montos certificados. Esta acción no se puede deshacer.',
    },
    paid: {
      title: 'Marcar como Pagado',
      desc: 'Confirma que el certificado fue cobrado/pagado. Esta acción no se puede deshacer.',
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/certificates`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Certificado #{certificate.number}</h1>
              <Badge variant={statusBadgeVariant(statusColor)}>{statusLabel}</Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm">{certificate.code}</p>
            {certificate.project && (
              <p className="text-sm text-muted-foreground">{certificate.project.name}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <Printer className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          {isDraft && (
            <Button onClick={() => setConfirmAction('submit')}>
              <Send className="mr-2 h-4 w-4" />
              Presentar
            </Button>
          )}
          {isSubmitted && (
            <Button onClick={() => setConfirmAction('approve')}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprobar
            </Button>
          )}
          {isApproved && (
            <Button variant="default" onClick={() => setConfirmAction('paid')}>
              <DollarSign className="mr-2 h-4 w-4" />
              Marcar como Pagado
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono">{formatDate(certificate.periodStart)}</p>
            <p className="text-sm font-mono text-muted-foreground">→ {formatDate(certificate.periodEnd)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Subtotal Período</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{formatCurrency(subtotal, { compact: true })}</p>
          </CardContent>
        </Card>

        {/* Factor de ajuste — editable en DRAFT */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Factor de Ajuste
              {isDraft && !editingFactor && (
                <button
                  onClick={() => { setFactorValue(adjustmentFactor.toFixed(4)); setEditingFactor(true); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Editar factor de ajuste"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingFactor ? (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={factorValue}
                  onChange={(e) => setFactorValue(e.target.value)}
                  className="h-8 font-mono text-sm w-28"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveFactor();
                    if (e.key === 'Escape') setEditingFactor(false);
                  }}
                />
                <button
                  onClick={handleSaveFactor}
                  disabled={updateFactorMutation.isPending}
                  className="text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingFactor(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold font-mono">{adjustmentFactor.toFixed(4)}</p>
                {certificate.budgetVersion && (
                  <p className="text-xs text-muted-foreground mt-1">{certificate.budgetVersion.code}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Certificado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-primary">
              {formatCurrency(totalAmount, { compact: true })}
            </p>
            {certificate.approvedAt && (
              <p className="text-xs text-muted-foreground mt-1">Aprobado {formatDate(certificate.approvedAt)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-1 text-sm">
            <div className="flex justify-between py-1">
              <span>Subtotal del período</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-1 text-destructive">
              <span>(-) Acopio ({(acopioPct * 100).toFixed(1)}%)</span>
              <span className="font-mono">-{formatCurrency(acopioAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-destructive">
              <span>(-) Anticipo Financiero ({(Number(certificate.anticipoPct) * 100).toFixed(1)}%)</span>
              <span className="font-mono">-{formatCurrency(anticipoAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-destructive">
              <span>(-) Fondo de Reparo ({(Number(certificate.fondoReparoPct) * 100).toFixed(1)}%)</span>
              <span className="font-mono">-{formatCurrency(fondoReparoAmount)}</span>
            </div>
            <div className="flex justify-between py-1 border-t text-muted-foreground">
              <span>= Neto antes de ajuste</span>
              <span className="font-mono">{formatCurrency(netBeforeAdj)}</span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>(×) Factor de ajuste ({adjustmentFactor.toFixed(4)})</span>
              <span className="font-mono">{formatCurrency(netAdj)}</span>
            </div>
            <div className="flex justify-between py-1 text-green-600">
              <span>(+) IVA ({(Number(certificate.ivaPct) * 100).toFixed(1)}%)</span>
              <span className="font-mono">+{formatCurrency(ivaAmount)}</span>
            </div>
            <div className="flex justify-between py-2 border-t font-bold text-primary text-base">
              <span>TOTAL CERTIFICADO</span>
              <span className="font-mono">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ítems del Certificado</CardTitle>
          {isDraft && (
            <p className="text-sm text-muted-foreground">
              Ingresá el avance del período actual para cada ítem (en %). El sistema acumula automáticamente el avance anterior.
            </p>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Nro</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-12">Ud</TableHead>
                  <TableHead className="text-right w-20">Cant.</TableHead>
                  <TableHead className="text-right w-24">P.U.</TableHead>
                  <TableHead className="text-right w-20">Av. Ant.</TableHead>
                  <TableHead className="text-right w-28">
                    Av. Período {isDraft && <span className="text-muted-foreground font-normal">(%)</span>}
                  </TableHead>
                  <TableHead className="text-right w-24">Av. Total</TableHead>
                  <TableHead className="text-right w-24">
                    <span title="Referencial: muestra cuánto corresponde al acopio por ítem. El descuento se aplica sobre el total del certificado.">
                      Acopio *
                    </span>
                  </TableHead>
                  <TableHead className="text-right w-28">Monto Per.</TableHead>
                  <TableHead className="text-right w-28">Monto Acum.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(stageGroups.entries()).map(([stageKey, items]) => {
                  const stageTotal = items.reduce((s, i) => s + Number(i.currentAmount), 0);
                  const stageTotalAccum = items.reduce((s, i) => s + Number(i.totalAmount), 0);
                  return [
                    // Fila de cabecera de etapa
                    <TableRow key={`stage-${stageKey}`} className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={9} className="font-semibold text-sm py-2">
                        Etapa {stageKey}
                      </TableCell>
                      <TableCell className="text-right font-semibold font-mono text-sm py-2">
                        {formatCurrency(stageTotal, { compact: true })}
                      </TableCell>
                      <TableCell className="text-right font-semibold font-mono text-sm py-2 text-muted-foreground">
                        {formatCurrency(stageTotalAccum, { compact: true })}
                      </TableCell>
                    </TableRow>,
                    // Ítems de la etapa
                    ...items.map((item) => {
                      const acopioItem = Number(item.currentAmount) * acopioPct;
                      const totalAdv = Number(item.totalAdvance);
                      const currentAdvancePct = (Number(item.currentAdvance) * 100).toFixed(1);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.itemNumber}</TableCell>
                          <TableCell className="max-w-[180px]">
                            <span className="text-sm line-clamp-2">{item.description}</span>
                          </TableCell>
                          <TableCell className="text-xs">{item.unit}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {Number(item.quantity).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(Number(item.unitPrice), { compact: true })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {(Number(item.previousAdvance) * 100).toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">
                            {isDraft ? (
                              // key fuerza re-montaje del input después de que la mutación actualiza el dato
                              <Input
                                key={`${item.id}-${item.currentAdvance}`}
                                type="number"
                                step="0.1"
                                min="0"
                                max={((1 - Number(item.previousAdvance)) * 100).toFixed(1)}
                                defaultValue={currentAdvancePct}
                                className="w-20 text-right font-mono text-xs ml-auto h-7"
                                onBlur={(e) =>
                                  handleAdvanceChange(item.id, e.target.value, item.previousAdvance)
                                }
                              />
                            ) : (
                              <span className="font-mono text-xs">
                                {currentAdvancePct}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono text-xs font-medium">
                                {(totalAdv * 100).toFixed(1)}%
                              </span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    totalAdv >= 1 ? 'bg-green-500' : totalAdv >= 0.5 ? 'bg-blue-500' : 'bg-primary/60'
                                  }`}
                                  style={{ width: `${Math.min(totalAdv * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-amber-600">
                            {acopioPct > 0 ? formatCurrency(acopioItem, { compact: true }) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {formatCurrency(Number(item.currentAmount), { compact: true })}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {formatCurrency(Number(item.totalAmount), { compact: true })}
                          </TableCell>
                        </TableRow>
                      );
                    }),
                  ];
                })}
              </TableBody>
            </Table>
          </div>
          {/* Totals footer */}
          <div className="border-t bg-muted/30 px-4 py-3 space-y-1">
            <div className="flex justify-end gap-8 text-sm font-semibold">
              {acopioPct > 0 && (
                <span>
                  Total Acopio:{' '}
                  <span className="font-mono text-amber-600">{formatCurrency(acopioAmount, { compact: true })}</span>
                </span>
              )}
              <span>
                Total Período:{' '}
                <span className="font-mono">{formatCurrency(subtotal, { compact: true })}</span>
              </span>
            </div>
            {acopioPct > 0 && (
              <p className="text-xs text-muted-foreground text-right">
                * Acopio por ítem es referencial. El descuento se aplica sobre el total del certificado (ver Resumen Financiero).
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction ? confirmMessages[confirmAction]?.title : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction ? confirmMessages[confirmAction]?.desc : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction === 'submit') submitMutation.mutate();
                else if (confirmAction === 'approve') approveMutation.mutate();
                else if (confirmAction === 'paid') markPaidMutation.mutate();
              }}
            >
              {(submitMutation.isPending || approveMutation.isPending || markPaidMutation.isPending)
                ? 'Procesando...'
                : confirmAction === 'submit'
                  ? 'Presentar'
                  : confirmAction === 'approve'
                    ? 'Aprobar'
                    : 'Marcar como Pagado'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
