'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Package,
  Receipt,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface SupplierMaterial {
  id: string;
  unitPrice: string;
  leadTimeDays: number | null;
  isPreferred: boolean;
  material: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
}

interface SupplierDetail {
  id: string;
  code: string;
  name: string;
  tradeName: string | null;
  cuit: string | null;
  taxCondition: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  alternativePhone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  bankName: string | null;
  bankAccount: string | null;
  cbu: string | null;
  alias: string | null;
  paymentTerms: string | null;
  notes: string | null;
  rating: number | null;
  isActive: boolean;
  createdAt: string;
  supplierMaterials: SupplierMaterial[];
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderDate: string;
  totalAmount: string;
  project: { id: string; code: string; name: string };
}

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const supplierId = params.id as string;

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => api.get<SupplierDetail>(`/suppliers/${supplierId}`),
  });

  const { data: orders } = useQuery({
    queryKey: ['supplier-orders', supplierId],
    queryFn: () => api.get<PurchaseOrder[]>(`/suppliers/${supplierId}/orders`),
    enabled: !!supplier,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/suppliers/${supplierId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor eliminado');
      router.push('/suppliers');
    },
    onError: () => {
      toast.error('Error al eliminar el proveedor');
    },
  });

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

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Proveedor no encontrado</p>
        <Link href="/suppliers">
          <Button>Volver a proveedores</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/suppliers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              <Badge variant="outline">{supplier.code}</Badge>
              <Badge variant={supplier.isActive ? 'success' : 'secondary'}>
                {supplier.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            {supplier.tradeName && (
              <p className="text-muted-foreground">{supplier.tradeName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/suppliers/${supplierId}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar Proveedor</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta accion no se puede deshacer. El proveedor sera eliminado permanentemente.
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
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informacion Fiscal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informacion Fiscal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">CUIT</p>
                <p className="font-medium">{supplier.cuit || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condicion IVA</p>
                <p className="font-medium">{supplier.taxCondition || '-'}</p>
              </div>
            </div>
            {supplier.paymentTerms && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Condiciones de Pago</p>
                  <p className="font-medium">{supplier.paymentTerms}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.contactName && (
              <div>
                <p className="text-sm text-muted-foreground">Nombre de Contacto</p>
                <p className="font-medium">{supplier.contactName}</p>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                  {supplier.email}
                </a>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">
                  {supplier.phone}
                </a>
              </div>
            )}
            {supplier.alternativePhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${supplier.alternativePhone}`} className="text-primary hover:underline">
                  {supplier.alternativePhone}
                </a>
              </div>
            )}
            {(supplier.address || supplier.city) && (
              <>
                <Separator />
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    {supplier.address && <p>{supplier.address}</p>}
                    <p>
                      {[supplier.city, supplier.province, supplier.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Datos Bancarios */}
        {(supplier.bankName || supplier.cbu || supplier.alias) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Datos Bancarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.bankName && (
                <div>
                  <p className="text-sm text-muted-foreground">Banco</p>
                  <p className="font-medium">{supplier.bankName}</p>
                </div>
              )}
              {supplier.bankAccount && (
                <div>
                  <p className="text-sm text-muted-foreground">Numero de Cuenta</p>
                  <p className="font-medium font-mono">{supplier.bankAccount}</p>
                </div>
              )}
              {supplier.cbu && (
                <div>
                  <p className="text-sm text-muted-foreground">CBU</p>
                  <p className="font-medium font-mono">{supplier.cbu}</p>
                </div>
              )}
              {supplier.alias && (
                <div>
                  <p className="text-sm text-muted-foreground">Alias</p>
                  <p className="font-medium">{supplier.alias}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notas */}
        {supplier.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{supplier.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Materiales que provee */}
      {supplier.supplierMaterials && supplier.supplierMaterials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materiales que Provee
            </CardTitle>
            <CardDescription>
              Lista de materiales disponibles de este proveedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">Tiempo Entrega</TableHead>
                  <TableHead>Preferido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.supplierMaterials.map((sm) => (
                  <TableRow key={sm.id}>
                    <TableCell>
                      <Badge variant="outline">{sm.material.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/materials/${sm.material.id}`}
                        className="font-medium hover:underline"
                      >
                        {sm.material.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sm.material.unit}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(sm.unitPrice))}
                    </TableCell>
                    <TableCell className="text-right">
                      {sm.leadTimeDays ? `${sm.leadTimeDays} dias` : '-'}
                    </TableCell>
                    <TableCell>
                      {sm.isPreferred && <Badge variant="success">Preferido</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Ordenes de Compra Recientes */}
      {orders && orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ordenes de Compra Recientes</CardTitle>
            <CardDescription>
              Ultimas ordenes de compra realizadas a este proveedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${order.project.id}`}
                        className="hover:underline"
                      >
                        {order.project.code} - {order.project.name}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(order.totalAmount))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{order.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
