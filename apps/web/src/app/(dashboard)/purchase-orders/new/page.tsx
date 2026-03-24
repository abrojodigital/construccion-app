'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Project { id: string; code: string; name: string }
interface Supplier { id: string; name: string }
interface Material { id: string; code: string; name: string; unit: string }

interface OrderItem {
  materialId: string;
  quantity: string;
  unitPrice: string;
  notes: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    projectId: '',
    supplierId: '',
    expectedDeliveryDate: '',
    deliveryAddress: '',
    notes: '',
    taxAmount: '0',
  });
  const [items, setItems] = useState<OrderItem[]>([
    { materialId: '', quantity: '', unitPrice: '', notes: '' },
  ]);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => api.get<{ data: Project[] }>('/projects?limit=100'),
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => api.get<{ data: Supplier[] }>('/suppliers?limit=100'),
  });

  const { data: materialsData } = useQuery({
    queryKey: ['materials-list'],
    queryFn: () => api.get<{ data: Material[] }>('/materials?limit=200'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/purchase-orders', data),
    onSuccess: (res: any) => {
      toast.success('Orden de compra creada exitosamente');
      router.push(`/purchase-orders/${res.id}`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al crear la orden'),
  });

  const projects = (projectsData as any)?.data?.data ?? (projectsData as any)?.data ?? [];
  const suppliers = (suppliersData as any)?.data?.data ?? (suppliersData as any)?.data ?? [];
  const materials = (materialsData as any)?.data?.data ?? (materialsData as any)?.data ?? [];

  const addItem = () => setItems([...items, { materialId: '', quantity: '', unitPrice: '', notes: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof OrderItem, value: string) =>
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
  const tax = parseFloat(form.taxAmount) || 0;
  const total = subtotal + tax;

  const handleSubmit = () => {
    if (!form.projectId) { toast.error('Selecciona un proyecto'); return; }
    if (!form.supplierId) { toast.error('Selecciona un proveedor'); return; }
    if (items.some(i => !i.materialId || !i.quantity || !i.unitPrice)) {
      toast.error('Completa todos los items de la orden'); return;
    }
    createMutation.mutate({
      ...form,
      taxAmount: parseFloat(form.taxAmount) || 0,
      items: items.map(i => ({
        materialId: i.materialId,
        quantity: parseFloat(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
        notes: i.notes || undefined,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/purchase-orders">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nueva Orden de Compra</h1>
          <p className="text-muted-foreground">Registra una nueva orden a proveedor</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos principales */}
        <Card>
          <CardHeader><CardTitle>Datos de la Orden</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proyecto *</label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proyecto..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: Project) => (
                    <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor *</label>
              <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: Supplier) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha de entrega esperada</label>
              <Input
                type="date"
                value={form.expectedDeliveryDate}
                onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Direccion de entrega</label>
              <Input
                value={form.deliveryAddress}
                onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                placeholder="Av. Principal 1234, Buenos Aires"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observaciones..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card>
          <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 border rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">$ {subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">IVA / Impuestos</span>
                <Input
                  type="number"
                  min="0"
                  className="w-32 h-7 text-right text-sm"
                  value={form.taxAmount}
                  onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                />
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span>$ {total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando...' : 'Crear Orden de Compra'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Materiales</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Material
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-4">
                <Select value={item.materialId} onValueChange={(v) => updateItem(i, 'materialId', v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Material..." />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m: Material) => (
                      <SelectItem key={m.id} value={m.id}>{m.code} - {m.name} ({m.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Cantidad"
                  className="text-sm"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min="0"
                  placeholder="Precio unitario"
                  className="text-sm"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="Notas"
                  className="text-sm"
                  value={item.notes}
                  onChange={(e) => updateItem(i, 'notes', e.target.value)}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
