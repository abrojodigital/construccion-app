'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Building2,
  User,
  Receipt,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EXPENSE_STATUS_LABELS } from '@construccion/shared';
import { toast } from 'sonner';

interface ExpenseItem {
  id: string;
  description: string | null;
  amount: string;
  budgetItem: { id: string; number: string; description: string; unit: string } | null;
}

interface ExpenseDetail {
  id: string;
  reference: string;
  description: string;
  amount: string;
  taxAmount: string;
  totalAmount: string;
  status: string;
  expenseDate: string;
  dueDate: string | null;
  invoiceNumber: string | null;
  invoiceType: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  project: { id: string; code: string; name: string };
  stage: { id: string; name: string } | null;
  task: { id: string; name: string } | null;
  category: { id: string; name: string; code: string; color: string };
  supplier: { id: string; name: string; cuit: string } | null;
  createdBy: { id: string; firstName: string; lastName: string };
  approvedBy: { id: string; firstName: string; lastName: string } | null;
  items: ExpenseItem[];
}

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const expenseId = params.id as string;

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => api.get<ExpenseDetail>(`/expenses/${expenseId}`),
  });

  const approveMutation = useMutation({
    mutationFn: () => api.patch(`/expenses/${expenseId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', expenseId] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Gasto aprobado exitosamente');
    },
    onError: () => {
      toast.error('Error al aprobar el gasto');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => api.patch(`/expenses/${expenseId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', expenseId] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Gasto rechazado');
    },
    onError: () => {
      toast.error('Error al rechazar el gasto');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/expenses/${expenseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Gasto eliminado');
      router.push('/expenses');
    },
    onError: () => {
      toast.error('Error al eliminar el gasto');
    },
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'PAID':
        return 'success';
      case 'PENDING_APPROVAL':
        return 'warning';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const canEdit = expense && !['APPROVED', 'PAID'].includes(expense.status);
  const canDelete = expense && expense.status === 'DRAFT';
  const canApprove = expense && expense.status === 'PENDING_APPROVAL';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Gasto no encontrado</p>
        <Link href="/expenses">
          <Button>Volver a gastos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/expenses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{expense.reference}</h1>
              <Badge variant={getStatusVariant(expense.status)}>
                {EXPENSE_STATUS_LABELS[expense.status as keyof typeof EXPENSE_STATUS_LABELS]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{expense.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canApprove && (
            <>
              <Button
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Rechazar Gasto</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta accion rechazara el gasto. Por favor, ingrese el motivo del rechazo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => rejectMutation.mutate('Rechazado por el administrador')}
                    >
                      Rechazar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {canEdit && (
            <Link href={`/expenses/${expenseId}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar Gasto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta accion no se puede deshacer. El gasto sera eliminado permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => deleteMutation.mutate()}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informacion Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Informacion del Gasto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monto (sin IVA)</p>
                <p className="font-medium">{formatCurrency(Number(expense.amount))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">IVA</p>
                <p className="font-medium">{formatCurrency(Number(expense.taxAmount))}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(Number(expense.totalAmount))}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Fecha del Gasto</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(expense.expenseDate)}
                </p>
              </div>
              {expense.dueDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Vencimiento</p>
                  <p className="font-medium">{formatDate(expense.dueDate)}</p>
                </div>
              )}
            </div>
            {expense.invoiceNumber && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Factura</p>
                    <p className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {expense.invoiceNumber}
                    </p>
                  </div>
                  {expense.invoiceType && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo</p>
                      <p className="font-medium">{expense.invoiceType}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Proyecto y Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Proyecto y Clasificacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Proyecto</p>
              <Link
                href={`/projects/${expense.project.id}`}
                className="font-medium text-primary hover:underline"
              >
                {expense.project.code} - {expense.project.name}
              </Link>
            </div>
            {expense.stage && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Etapa</p>
                  <p className="font-medium">{expense.stage.name}</p>
                </div>
              </>
            )}
            {expense.task && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <ClipboardList className="h-3 w-3" />
                    Tarea
                  </p>
                  <p className="font-medium">{expense.task.name}</p>
                </div>
              </>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Categoria</p>
              <Badge
                variant="outline"
                style={{
                  borderColor: expense.category.color,
                  color: expense.category.color,
                }}
              >
                {expense.category.name}
              </Badge>
            </div>
            {expense.supplier && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Proveedor</p>
                  <Link
                    href={`/suppliers/${expense.supplier.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {expense.supplier.name}
                  </Link>
                  {expense.supplier.cuit && (
                    <p className="text-sm text-muted-foreground">CUIT: {expense.supplier.cuit}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Informacion de Aprobacion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Registro y Aprobacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Creado por</p>
              <p className="font-medium">
                {expense.createdBy.firstName} {expense.createdBy.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{formatDate(expense.createdAt)}</p>
            </div>
            {expense.approvedBy && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {expense.status === 'REJECTED' ? 'Rechazado por' : 'Aprobado por'}
                  </p>
                  <p className="font-medium">
                    {expense.approvedBy.firstName} {expense.approvedBy.lastName}
                  </p>
                  {expense.approvedAt && (
                    <p className="text-sm text-muted-foreground">{formatDate(expense.approvedAt)}</p>
                  )}
                </div>
              </>
            )}
            {expense.rejectionReason && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Motivo del Rechazo</p>
                  <p className="font-medium text-red-600">{expense.rejectionReason}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ítems presupuestarios */}
      {expense.items && expense.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Ítems Presupuestarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Ítem</th>
                    <th className="text-left py-2 pr-4 font-medium">Descripción</th>
                    <th className="text-left py-2 pr-4 font-medium">Nota</th>
                    <th className="text-right py-2 font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {expense.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                        {item.budgetItem?.number || '—'}
                      </td>
                      <td className="py-2 pr-4">
                        {item.budgetItem?.description || '—'}
                        {item.budgetItem?.unit && (
                          <span className="text-muted-foreground text-xs ml-1">
                            ({item.budgetItem.unit})
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {item.description || '—'}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(Number(item.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
