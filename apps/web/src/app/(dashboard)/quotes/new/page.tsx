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

interface Supplier { id: string; name: string }
interface Material { id: string; code: string; name: string; unit: string }

interface QuoteItem {
  materialId: string;
  quantity: string;
  notes: string;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    supplierId: '',
    validUntil: '',
    notes: '',
  });
  const [items, setItems] = useState<QuoteItem[]>([
    { materialId: '', quantity: '', notes: '' },
  ]);

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => api.get<any>('/suppliers?limit=100'),
  });

  const { data: materialsData } = useQuery({
    queryKey: ['materials-list'],
    queryFn: () => api.get<any>('/materials?limit=200'),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/quotes', data),
    onSuccess: (res: any) => {
      toast.success('Cotizacion creada exitosamente');
      router.push(`/quotes/${res.id}`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al crear la cotizacion'),
  });

  const suppliers = (suppliersData as any)?.data?.data ?? (suppliersData as any)?.data ?? [];
  const materials = (materialsData as any)?.data?.data ?? (materialsData as any)?.data ?? [];

  const addItem = () => setItems([...items, { materialId: '', quantity: '', notes: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof QuoteItem, value: string) =>
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));

  const handleSubmit = () => {
    if (!form.supplierId) { toast.error('Selecciona un proveedor'); return; }
    if (items.some(i => !i.materialId || !i.quantity)) {
      toast.error('Completa todos los materiales'); return;
    }
    createMutation.mutate({
      ...form,
      validUntil: form.validUntil || undefined,
      notes: form.notes || undefined,
      items: items.map(i => ({
        materialId: i.materialId,
        quantity: parseFloat(i.quantity),
        notes: i.notes || undefined,
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/quotes">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nueva Cotizacion</h1>
          <p className="text-muted-foreground">Solicita una cotizacion a un proveedor</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Datos de la Cotizacion</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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
              <label className="text-sm font-medium">Fecha de vencimiento</label>
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Instrucciones al proveedor..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resumen</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {items.length} material(es) a cotizar
            </p>
            <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creando...' : 'Crear Solicitud de Cotizacion'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Materiales a Cotizar</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Material
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <div className="col-span-6">
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
