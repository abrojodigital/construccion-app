'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Search, Package, Users, Wrench, Plus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { createBudgetItemSchema } from '@construccion/shared/validators';
import { BUDGET_UNITS } from '@construccion/shared';
import { formatCurrency } from '@/lib/utils';
import { MaterialForm } from '@/components/forms/material-form';
import { LaborCategoryForm } from '@/components/forms/labor-category-form';
import { EquipmentCatalogForm } from '@/components/forms/equipment-catalog-form';
import { toast } from 'sonner';

type ItemFormValues = z.infer<typeof createBudgetItemSchema>;

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  lastPurchasePrice: string | null;
}

interface LaborCategory {
  id: string;
  code: string;
  name: string;
  totalHourlyCost: string;
}

interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  totalHourlyCost: string;
}

type NewDialog = 'material' | 'labor' | 'equipment' | null;

interface BudgetItemFormProps {
  stageId: string;
  budgetVersionId: string;
  initialData?: ItemFormValues & { id: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetItemForm({
  stageId,
  budgetVersionId,
  initialData,
  onSuccess,
  onCancel,
}: BudgetItemFormProps) {
  const isEditing = !!initialData;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newDialog, setNewDialog] = useState<NewDialog>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(createBudgetItemSchema),
    defaultValues: initialData || { number: '', description: '', unit: '', quantity: 0, unitPrice: 0 },
  });

  const quantity = useWatch({ control, name: 'quantity' }) || 0;
  const unitPrice = useWatch({ control, name: 'unitPrice' }) || 0;
  const total = Number(quantity) * Number(unitPrice);

  // ── Catalog queries ──────────────────────────────────────────────────────
  const { data: matRes, isLoading: matLoading } = useQuery({
    queryKey: ['materials-catalog'],
    queryFn: () =>
      api.get<{ data: Material[]; pagination: unknown }>('/materials', { params: { limit: 100 } }),
  });
  const allMaterials: Material[] = matRes?.data ?? [];

  const { data: allLabor = [], isLoading: laborLoading } = useQuery({
    queryKey: ['labor-categories'],
    queryFn: () => api.get<LaborCategory[]>('/labor-categories'),
  });

  const { data: allEquipment = [], isLoading: equipLoading } = useQuery({
    queryKey: ['equipment-catalog'],
    queryFn: () => api.get<EquipmentItem[]>('/equipment-catalog'),
  });

  const q = search.toLowerCase();
  const mats = allMaterials.filter(
    (m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
  );
  const labor = allLabor.filter(
    (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
  );
  const equip = allEquipment.filter(
    (e) => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)
  );

  // ── Apply catalog selection ───────────────────────────────────────────────
  const applyMaterial = (m: Material) => {
    setValue('description', m.name);
    setValue('unit', m.unit);
    if (m.lastPurchasePrice) setValue('unitPrice', Number(m.lastPurchasePrice));
    setSelectedId(m.id);
  };
  const applyLabor = (l: LaborCategory) => {
    setValue('description', l.name);
    setValue('unit', 'h');
    setValue('unitPrice', Number(l.totalHourlyCost));
    setSelectedId(l.id);
  };
  const applyEquipment = (e: EquipmentItem) => {
    setValue('description', e.name);
    setValue('unit', 'h');
    setValue('unitPrice', Number(e.totalHourlyCost));
    setSelectedId(e.id);
  };

  const onSubmit = async (data: ItemFormValues) => {
    if (isEditing) {
      await api.put(`/budget-versions/${budgetVersionId}/items/${initialData.id}`, data);
    } else {
      await api.post(`/budget-versions/${budgetVersionId}/stages/${stageId}/items`, data);
    }
    onSuccess?.();
  };

  // ── Reusable row button ──────────────────────────────────────────────────
  const Row = ({
    id,
    label,
    sub,
    right,
    onClick,
  }: {
    id: string;
    label: string;
    sub: string;
    right?: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors
        ${selectedId === id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {selectedId === id && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
        <div className="min-w-0">
          <p className="font-medium truncate leading-tight">{label}</p>
          <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
        </div>
      </div>
      {right && (
        <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">{right}</span>
      )}
    </button>
  );

  const EmptyState = ({ msg }: { msg: string }) => (
    <p className="py-6 text-center text-xs text-muted-foreground">{msg}</p>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-1 p-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-9 rounded bg-muted animate-pulse" />
      ))}
    </div>
  );

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-5">
          {/* ── LEFT: campos del ítem ── */}
          <div className="w-[220px] shrink-0 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Número *</label>
                <Input {...register('number')} placeholder="1.1.1" className="h-8 text-sm" />
                {errors.number && (
                  <p className="text-xs text-destructive">{errors.number.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Unidad *</label>
                <Select defaultValue={initialData?.unit} onValueChange={(v) => setValue('unit', v)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label} ({u.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium">Descripción *</label>
              <Input
                {...register('description')}
                placeholder="Ej: Cemento Portland"
                className="h-8 text-sm"
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Cantidad *</label>
                <Input
                  type="number"
                  step="0.0001"
                  {...register('quantity', { valueAsNumber: true })}
                  placeholder="0"
                  className="h-8 text-sm"
                />
                {errors.quantity && (
                  <p className="text-xs text-destructive">{errors.quantity.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">P.U. (CC) *</label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('unitPrice', { valueAsNumber: true })}
                  placeholder="0.00"
                  className="h-8 text-sm"
                />
                {errors.unitPrice && (
                  <p className="text-xs text-destructive">{errors.unitPrice.message}</p>
                )}
              </div>
            </div>

            <div className="rounded-md bg-muted p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Total Costo-Costo</p>
              <p className="text-lg font-bold font-mono">
                {isNaN(total) || total === 0
                  ? '$ –'
                  : `$ ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
              </p>
            </div>

            <div className="flex gap-2 pt-1 border-t mt-auto">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              )}
              <Button type="submit" size="sm" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </div>

          {/* ── SEPARATOR ── */}
          <Separator orientation="vertical" />

          {/* ── RIGHT: catálogo ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Buscá y seleccioná un elemento para pre-completar los campos
            </p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="material">
              <TabsList className="w-full h-8">
                <TabsTrigger value="material" className="flex-1 text-xs gap-1">
                  <Package className="h-3 w-3" />
                  Materiales
                  {allMaterials.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {mats.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="labor" className="flex-1 text-xs gap-1">
                  <Users className="h-3 w-3" />
                  Mano de Obra
                  {allLabor.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {labor.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="equipment" className="flex-1 text-xs gap-1">
                  <Wrench className="h-3 w-3" />
                  Equipos
                  {allEquipment.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {equip.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* MATERIALES */}
              <TabsContent value="material" className="mt-1">
                <div className="rounded-md border">
                  <div className="max-h-52 overflow-y-auto p-1">
                    {matLoading ? (
                      <LoadingSkeleton />
                    ) : mats.length === 0 ? (
                      <EmptyState
                        msg={search ? 'Sin resultados' : 'No hay materiales en el catálogo'}
                      />
                    ) : (
                      mats.map((m) => (
                        <Row
                          key={m.id}
                          id={m.id}
                          label={m.name}
                          sub={`${m.code} · ${m.unit}`}
                          right={
                            m.lastPurchasePrice
                              ? formatCurrency(Number(m.lastPurchasePrice))
                              : undefined
                          }
                          onClick={() => applyMaterial(m)}
                        />
                      ))
                    )}
                  </div>
                  <div className="border-t p-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setNewDialog('material')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar nuevo material
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* MANO DE OBRA */}
              <TabsContent value="labor" className="mt-1">
                <div className="rounded-md border">
                  <div className="max-h-52 overflow-y-auto p-1">
                    {laborLoading ? (
                      <LoadingSkeleton />
                    ) : labor.length === 0 ? (
                      <EmptyState
                        msg={search ? 'Sin resultados' : 'No hay categorías de mano de obra'}
                      />
                    ) : (
                      labor.map((l) => (
                        <Row
                          key={l.id}
                          id={l.id}
                          label={l.name}
                          sub={l.code}
                          right={`${formatCurrency(Number(l.totalHourlyCost))}/h`}
                          onClick={() => applyLabor(l)}
                        />
                      ))
                    )}
                  </div>
                  <div className="border-t p-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setNewDialog('labor')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar nueva categoría
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* EQUIPOS */}
              <TabsContent value="equipment" className="mt-1">
                <div className="rounded-md border">
                  <div className="max-h-52 overflow-y-auto p-1">
                    {equipLoading ? (
                      <LoadingSkeleton />
                    ) : equip.length === 0 ? (
                      <EmptyState
                        msg={search ? 'Sin resultados' : 'No hay equipos en el catálogo'}
                      />
                    ) : (
                      equip.map((e) => (
                        <Row
                          key={e.id}
                          id={e.id}
                          label={e.name}
                          sub={e.code}
                          right={`${formatCurrency(Number(e.totalHourlyCost))}/h`}
                          onClick={() => applyEquipment(e)}
                        />
                      ))
                    )}
                  </div>
                  <div className="border-t p-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => setNewDialog('equipment')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar nuevo equipo
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </form>

      {/* ── Sub-diálogos para agregar al catálogo ── */}
      <Dialog open={newDialog === 'material'} onOpenChange={(o) => !o && setNewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Material</DialogTitle>
          </DialogHeader>
          <MaterialForm
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['materials-catalog'] });
              toast.success('Material creado');
              setNewDialog(null);
            }}
            onCancel={() => setNewDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={newDialog === 'labor'} onOpenChange={(o) => !o && setNewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Categoría de Mano de Obra</DialogTitle>
          </DialogHeader>
          <LaborCategoryForm
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['labor-categories'] });
              toast.success('Categoría creada');
              setNewDialog(null);
            }}
            onCancel={() => setNewDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={newDialog === 'equipment'} onOpenChange={(o) => !o && setNewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Equipo</DialogTitle>
          </DialogHeader>
          <EquipmentCatalogForm
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
              toast.success('Equipo creado');
              setNewDialog(null);
            }}
            onCancel={() => setNewDialog(null)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
