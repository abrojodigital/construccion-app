'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, Trash2, DollarSign, Clock, CheckCircle2, CalendarDays, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

const SCurveCertificates = dynamic(
  () => import('@/components/charts/scurve-certificates').then((m) => m.SCurveCertificates),
  { ssr: false, loading: () => <div className="h-72 animate-pulse bg-muted rounded-lg" /> }
);
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { CertificateForm } from '@/components/forms/certificate-form';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  CERTIFICATE_STATUS_LABELS,
  CERTIFICATE_STATUS_COLORS,
} from '@construccion/shared/constants';

type CertificateStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED' | 'ANNULLED';

interface Certificate {
  id: string;
  code: string;
  number: number;
  status: CertificateStatus;
  periodStart: string;
  periodEnd: string;
  subtotal: string;
  totalAmount: string;
  approvedAt: string | null;
  createdAt: string;
}

interface CertificateListResponse {
  data: Certificate[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const statusBadgeVariant = (color: string) => {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    gray: 'secondary',
    yellow: 'outline',
    green: 'default',
    blue: 'default',
  };
  return map[color] || 'secondary';
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
}

export default function CertificatesPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch all to build summary cards and monthly groups (limit=100)
  const { data, isLoading } = useQuery({
    queryKey: ['certificates', projectId],
    queryFn: () =>
      api.get<CertificateListResponse>(
        `/projects/${projectId}/certificates?page=1&limit=100&sortOrder=desc`
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/certificates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates', projectId] });
      toast.success('Certificado eliminado');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Error al eliminar certificado');
    },
  });

  const allCertificates = data?.data ?? [];

  // Summary stats
  const stats = useMemo(() => {
    const totalCertified = allCertificates
      .filter((c) => c.status !== 'DRAFT')
      .reduce((sum, c) => sum + Number(c.totalAmount), 0);

    const pendingPayment = allCertificates
      .filter((c) => c.status === 'APPROVED')
      .reduce((sum, c) => sum + Number(c.totalAmount), 0);

    const paid = allCertificates
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + Number(c.totalAmount), 0);

    const currentMonthKey = monthKey(new Date().toISOString());
    const currentMonthTotal = allCertificates
      .filter((c) => c.status !== 'DRAFT' && monthKey(c.periodEnd) === currentMonthKey)
      .reduce((sum, c) => sum + Number(c.totalAmount), 0);

    return { totalCertified, pendingPayment, paid, currentMonthTotal };
  }, [allCertificates]);

  // S-curve: cumulative certified by month (only non-DRAFT)
  const sCurveData = useMemo(() => {
    const monthly: Record<string, number> = {};
    allCertificates
      .filter((c) => c.status !== 'DRAFT')
      .forEach((c) => {
        const key = monthKey(c.periodEnd);
        monthly[key] = (monthly[key] || 0) + Number(c.totalAmount);
      });
    const sorted = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b));
    let cumulative = 0;
    return sorted.map(([key, amount]) => {
      cumulative += amount;
      return { mes: monthLabel(key), mensual: amount, acumulado: cumulative };
    });
  }, [allCertificates]);

  // Filter + group by month
  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return allCertificates;
    return allCertificates.filter((c) => c.status === statusFilter);
  }, [allCertificates, statusFilter]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Certificate[]> = {};
    for (const cert of filtered) {
      const key = monthKey(cert.periodEnd);
      if (!groups[key]) groups[key] = [];
      groups[key].push(cert);
    }
    // Sort keys descending
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Certificaciones</h1>
            <p className="text-muted-foreground">Certificados de obra del proyecto</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Certificado
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Certificado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {formatCurrency(stats.totalCertified, { compact: true })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {allCertificates.filter((c) => c.status !== 'DRAFT').length} certificados emitidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mes Actual
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {formatCurrency(stats.currentMonthTotal, { compact: true })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendiente de Pago
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-amber-600">
              {formatCurrency(stats.pendingPayment, { compact: true })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {allCertificates.filter((c) => c.status === 'APPROVED').length} aprobados sin pagar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cobrado
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono text-green-600">
              {formatCurrency(stats.paid, { compact: true })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {allCertificates.filter((c) => c.status === 'PAID').length} certificados pagados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* S-curve */}
      {sCurveData.length >= 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Curva de Inversión</CardTitle>
                <CardDescription>Montos certificados mensuales y acumulados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SCurveCertificates data={sCurveData} />
          </CardContent>
        </Card>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filtrar por estado:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="DRAFT">Borrador</SelectItem>
            <SelectItem value="SUBMITTED">Presentado</SelectItem>
            <SelectItem value="APPROVED">Aprobado</SelectItem>
            <SelectItem value="PAID">Pagado</SelectItem>
            <SelectItem value="REJECTED">Rechazado</SelectItem>
            <SelectItem value="ANNULLED">Anulado</SelectItem>
          </SelectContent>
        </Select>
        {filtered.length !== allCertificates.length && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} de {allCertificates.length} certificados
          </span>
        )}
      </div>

      {/* Monthly groups */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse bg-muted rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Sin certificados</h3>
            <p className="text-muted-foreground mt-2">
              {statusFilter === 'ALL'
                ? 'Crea el primer certificado para este proyecto.'
                : `No hay certificados con estado "${CERTIFICATE_STATUS_LABELS[statusFilter as CertificateStatus] ?? statusFilter}".`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedByMonth.map(([key, certs]) => {
            const monthTotal = certs.reduce((sum, c) => sum + Number(c.totalAmount), 0);
            return (
              <Card key={key}>
                {/* Month header */}
                <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{monthLabel(key)}</span>
                    <span className="text-muted-foreground text-sm">
                      — {certs.length} {certs.length === 1 ? 'certificado' : 'certificados'}
                    </span>
                  </div>
                  <span className="font-mono font-semibold">
                    {formatCurrency(monthTotal, { compact: true })}
                  </span>
                </div>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Nro</TableHead>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Aprobado</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certs.map((cert) => {
                        const statusColor = CERTIFICATE_STATUS_COLORS[cert.status] || 'gray';
                        const statusLabel = CERTIFICATE_STATUS_LABELS[cert.status] || cert.status;
                        return (
                          <TableRow key={cert.id}>
                            <TableCell>
                              <Link
                                href={`/projects/${projectId}/certificates/${cert.id}`}
                                className="font-mono text-primary hover:underline"
                              >
                                {cert.code}
                              </Link>
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              #{cert.number}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(cert.periodStart)} — {formatDate(cert.periodEnd)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusBadgeVariant(statusColor)}>
                                {statusLabel}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(Number(cert.subtotal), { compact: true })}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {formatCurrency(Number(cert.totalAmount), { compact: true })}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {cert.approvedAt ? formatDate(cert.approvedAt) : '-'}
                            </TableCell>
                            <TableCell>
                              {cert.status === 'DRAFT' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() => setDeleteId(cert.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Certificado</DialogTitle>
          </DialogHeader>
          <CertificateForm
            projectId={projectId}
            onSuccess={() => {
              setShowCreateDialog(false);
              queryClient.invalidateQueries({ queryKey: ['certificates', projectId] });
              toast.success('Certificado creado');
            }}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Certificado</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El certificado sera eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
