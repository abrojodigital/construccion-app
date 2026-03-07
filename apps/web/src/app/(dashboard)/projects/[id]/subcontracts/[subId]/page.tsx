'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  Building2,
  Mail,
  Phone,
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
import { SubcontractItemForm } from '@/components/forms/subcontract-item-form';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  SUBCONTRACT_STATUS_LABELS,
  SUBCONTRACT_STATUS_COLORS,
} from '@construccion/shared/constants';

type SubcontractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface SubcontractItem {
  id: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  budgetItemId: string | null;
}

interface SubcontractCertificateItem {
  id: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  previousAdvance: string;
  currentAdvance: string;
  currentAmount: string;
  totalAdvance: string;
  totalAmount: string;
  subcontractItemId: string;
}

interface SubcontractCertificate {
  id: string;
  code: string;
  number: number;
  status: 'DRAFT' | 'APPROVED';
  periodStart: string;
  periodEnd: string;
  subtotal: string;
  totalAmount: string;
  approvedAt: string | null;
  items: SubcontractCertificateItem[];
}

interface SubcontractDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  contractorName: string;
  contractorCuit: string;
  contactEmail: string | null;
  contactPhone: string | null;
  startDate: string | null;
  endDate: string | null;
  totalAmount: string;
  status: SubcontractStatus;
  createdAt: string;
  items: SubcontractItem[];
  certificates: SubcontractCertificate[];
}

const statusBadgeVariant = (color: string) => {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    gray: 'secondary',
    green: 'default',
    blue: 'default',
    red: 'destructive',
  };
  return map[color] || 'secondary';
};

export default function SubcontractDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const subId = params.subId as string;

  const [showAddItem, setShowAddItem] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [showCreateCert, setShowCreateCert] = useState(false);
  const [certPeriodStart, setCertPeriodStart] = useState('');
  const [certPeriodEnd, setCertPeriodEnd] = useState('');
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [expandedCert, setExpandedCert] = useState<string | null>(null);

  const { data: subcontract, isLoading } = useQuery({
    queryKey: ['subcontract', subId],
    queryFn: () => api.get<SubcontractDetail>(`/subcontracts/${subId}`),
  });

  const addItemMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(`/subcontracts/${subId}/items`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontract', subId] });
      toast.success('Item agregado');
      setShowAddItem(false);
    },
    onError: () => toast.error('Error al agregar item'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/subcontracts/${subId}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontract', subId] });
      toast.success('Item eliminado');
      setDeleteItemId(null);
    },
    onError: () => toast.error('Error al eliminar item'),
  });

  const activateMutation = useMutation({
    mutationFn: () => api.post(`/subcontracts/${subId}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontract', subId] });
      queryClient.invalidateQueries({ queryKey: ['subcontracts', projectId] });
      toast.success('Subcontrato activado');
      setConfirmActivate(false);
    },
    onError: () => toast.error('Error al activar subcontrato'),
  });

  const createCertMutation = useMutation({
    mutationFn: (data: { periodStart: string; periodEnd: string }) =>
      api.post(`/subcontracts/${subId}/certificates`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontract', subId] });
      toast.success('Certificado creado');
      setShowCreateCert(false);
      setCertPeriodStart('');
      setCertPeriodEnd('');
    },
    onError: () => toast.error('Error al crear certificado'),
  });

  const updateCertItemMutation = useMutation({
    mutationFn: ({
      certId,
      itemId,
      currentAdvance,
    }: {
      certId: string;
      itemId: string;
      currentAdvance: number;
    }) =>
      api.put(`/subcontracts/${subId}/certificates/${certId}/items/${itemId}`, {
        currentAdvance,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontract', subId] });
    },
    onError: () => toast.error('Error al actualizar avance'),
  });

  const approveCertMutation = useMutation({
    mutationFn: (certId: string) =>
      api.post(`/subcontracts/${subId}/certificates/${certId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontract', subId] });
      toast.success('Certificado aprobado');
    },
    onError: () => toast.error('Error al aprobar certificado'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="h-32 animate-pulse bg-muted rounded" />
        <div className="h-64 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  if (!subcontract) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-medium">Subcontrato no encontrado</h2>
      </div>
    );
  }

  const isDraft = subcontract.status === 'DRAFT';
  const isActive = subcontract.status === 'ACTIVE';
  const statusColor = SUBCONTRACT_STATUS_COLORS[subcontract.status] || 'gray';
  const statusLabel = SUBCONTRACT_STATUS_LABELS[subcontract.status] || subcontract.status;
  const itemsTotal = subcontract.items.reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/subcontracts`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{subcontract.name}</h1>
              <Badge variant={statusBadgeVariant(statusColor)}>{statusLabel}</Badge>
            </div>
            <p className="text-muted-foreground font-mono">{subcontract.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDraft && subcontract.items.length > 0 && (
            <Button onClick={() => setConfirmActivate(true)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Activar
            </Button>
          )}
          {isActive && (
            <Button onClick={() => setShowCreateCert(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Certificado
            </Button>
          )}
        </div>
      </div>

      {/* Contractor Info + Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Contratista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="font-medium">{subcontract.contractorName}</p>
            <p className="text-sm text-muted-foreground font-mono">
              CUIT: {subcontract.contractorCuit}
            </p>
            {subcontract.contactEmail && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> {subcontract.contactEmail}
              </p>
            )}
            {subcontract.contactPhone && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> {subcontract.contactPhone}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monto Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(Number(subcontract.totalAmount), { compact: true })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monto Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(itemsTotal, { compact: true })}
            </div>
            <p className="text-sm text-muted-foreground">
              {subcontract.items.length} items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period */}
      {(subcontract.startDate || subcontract.endDate) && (
        <Card>
          <CardContent className="py-3 flex gap-8">
            {subcontract.startDate && (
              <div>
                <span className="text-sm text-muted-foreground">Inicio: </span>
                <span className="font-mono">{formatDate(subcontract.startDate)}</span>
              </div>
            )}
            {subcontract.endDate && (
              <div>
                <span className="text-sm text-muted-foreground">Fin: </span>
                <span className="font-mono">{formatDate(subcontract.endDate)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items del Subcontrato</CardTitle>
          {isDraft && (
            <Button size="sm" onClick={() => setShowAddItem(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Item
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {subcontract.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay items. Agrega items al subcontrato.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">P.U.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {isDraft && <TableHead className="w-[60px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcontract.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(item.quantity).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(Number(item.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(Number(item.totalPrice))}
                    </TableCell>
                    {isDraft && (
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteItemId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="font-medium text-right">
                    Total Items
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatCurrency(itemsTotal, { compact: true })}
                  </TableCell>
                  {isDraft && <TableCell />}
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Certificates Section */}
      {(isActive || subcontract.certificates.length > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Certificados del Subcontrato</CardTitle>
            {isActive && (
              <Button size="sm" onClick={() => setShowCreateCert(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Certificado
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {subcontract.certificates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay certificados aun.
              </div>
            ) : (
              <div className="divide-y">
                {subcontract.certificates.map((cert) => (
                  <div key={cert.id} className="p-4">
                    {/* Certificate Header Row */}
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setExpandedCert(expandedCert === cert.id ? null : cert.id)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm">{cert.code}</span>
                        <Badge
                          variant={
                            cert.status === 'APPROVED' ? 'default' : 'secondary'
                          }
                        >
                          {cert.status === 'APPROVED' ? 'Aprobado' : 'Borrador'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(cert.periodStart)} — {formatDate(cert.periodEnd)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-medium">
                          {formatCurrency(Number(cert.totalAmount), { compact: true })}
                        </span>
                        {cert.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveCertMutation.mutate(cert.id);
                            }}
                          >
                            Aprobar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Items */}
                    {expandedCert === cert.id && (
                      <div className="mt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descripcion</TableHead>
                              <TableHead>Unidad</TableHead>
                              <TableHead className="text-right">Cant.</TableHead>
                              <TableHead className="text-right">P.U.</TableHead>
                              <TableHead className="text-right">Av. Ant.</TableHead>
                              <TableHead className="text-right">
                                {cert.status === 'DRAFT' ? 'Avance Actual' : 'Av. Periodo'}
                              </TableHead>
                              <TableHead className="text-right">Av. Total</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cert.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {Number(item.quantity).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(Number(item.unitPrice))}
                                </TableCell>
                                <TableCell className="text-right font-mono text-muted-foreground">
                                  {(Number(item.previousAdvance) * 100).toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-right">
                                  {cert.status === 'DRAFT' ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max={1 - Number(item.previousAdvance)}
                                      defaultValue={Number(item.currentAdvance)}
                                      className="w-24 text-right font-mono ml-auto"
                                      onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (isNaN(val) || val < 0) return;
                                        const max = 1 - Number(item.previousAdvance);
                                        updateCertItemMutation.mutate({
                                          certId: cert.id,
                                          itemId: item.id,
                                          currentAdvance: Math.min(val, max),
                                        });
                                      }}
                                    />
                                  ) : (
                                    <span className="font-mono">
                                      {(Number(item.currentAdvance) * 100).toFixed(1)}%
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  {(Number(item.totalAdvance) * 100).toFixed(1)}%
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(Number(item.currentAmount))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Item</DialogTitle>
          </DialogHeader>
          <SubcontractItemForm
            onSubmit={async (data) => {
              await addItemMutation.mutateAsync(data as unknown as Record<string, unknown>);
            }}
            onCancel={() => setShowAddItem(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Create Certificate Dialog */}
      <Dialog open={showCreateCert} onOpenChange={setShowCreateCert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Certificado de Subcontrato</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Inicio del Periodo *</label>
                <Input
                  type="date"
                  value={certPeriodStart}
                  onChange={(e) => setCertPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fin del Periodo *</label>
                <Input
                  type="date"
                  value={certPeriodEnd}
                  onChange={(e) => setCertPeriodEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateCert(false)}>
                Cancelar
              </Button>
              <Button
                disabled={!certPeriodStart || !certPeriodEnd}
                onClick={() =>
                  createCertMutation.mutate({
                    periodStart: certPeriodStart,
                    periodEnd: certPeriodEnd,
                  })
                }
              >
                Crear Certificado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Item</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Desea eliminar este item del subcontrato?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteItemId && deleteItemMutation.mutate(deleteItemId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation */}
      <AlertDialog open={confirmActivate} onOpenChange={setConfirmActivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activar Subcontrato</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez activado, no se podran modificar los items del subcontrato. ¿Desea continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => activateMutation.mutate()}>
              Activar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
