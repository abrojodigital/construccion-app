'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  RefreshCw,
  Package,
  Users,
  Truck,
  Wrench,
  Fuel,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { api } from '@/lib/api';
import { ApuMaterialForm } from '@/components/forms/apu-material-form';
import { ApuLaborForm } from '@/components/forms/apu-labor-form';
import { ApuEquipmentForm } from '@/components/forms/apu-equipment-form';
import { ApuTransportForm } from '@/components/forms/apu-transport-form';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface PriceAnalysisDetail {
  id: string;
  code: string;
  totalMaterials: string;
  totalLabor: string;
  totalTransport: string;
  totalEquipAmort: string;
  totalRepairs: string;
  totalFuel: string;
  totalDirect: string;
  budgetItem: {
    id: string;
    number: string;
    description: string;
    unit: string;
    quantity: string;
    unitPrice: string;
  };
  materials: Array<{
    id: string;
    description: string;
    unit: string;
    quantity: string;
    unitCost: string;
    wastePct: string;
    totalCost: string;
    indecCode: string | null;
  }>;
  laborItems: Array<{
    id: string;
    category: string;
    quantity: string;
    hourlyRate: string;
    totalCost: string;
  }>;
  equipment: Array<{
    id: string;
    description: string;
    section: string;
    hoursUsed: string;
    hourlyTotal: string;
    totalCost: string;
    amortInterest: string;
    repairsCost: string;
    fuelCost: string;
    lubricantsCost: string;
  }>;
  transport: Array<{
    id: string;
    description: string;
    unit: string;
    quantity: string;
    unitCost: string;
    totalCost: string;
  }>;
}

export default function ApuPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const versionId = params.versionId as string;
  const budgetItemId = params.budgetItemId as string;

  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [addLaborOpen, setAddLaborOpen] = useState(false);
  const [addEquipmentOpen, setAddEquipmentOpen] = useState(false);
  const [addTransportOpen, setAddTransportOpen] = useState(false);

  const { data: apu, isLoading } = useQuery({
    queryKey: ['price-analysis', budgetItemId],
    queryFn: () => api.get<PriceAnalysisDetail>(`/budget-items/${budgetItemId}/price-analysis`),
  });

  const createApuMutation = useMutation({
    mutationFn: () => api.post(`/budget-items/${budgetItemId}/price-analysis`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-analysis', budgetItemId] });
      toast.success('APU creado');
    },
    onError: (error: any) => toast.error(error.message || 'Error al crear APU'),
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      if (!apu) throw new Error('APU no encontrado');
      return api.post(`/price-analyses/${apu.id}/recalculate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-analysis', budgetItemId] });
      toast.success('Totales recalculados');
    },
    onError: (error: any) => toast.error(error.message || 'Error al recalcular'),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['price-analysis', budgetItemId] });

  const deleteItem = async (type: string, id: string) => {
    try {
      await api.delete(`/price-analyses/${apu!.id}/${type}/${id}`);
      invalidate();
      toast.success('Eliminado correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded"></div>
      </div>
    );
  }

  // No APU yet — show create button
  if (!apu) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/budget-versions/${versionId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Analisis de Precios Unitarios</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Este item no tiene un APU creado todavia
            </p>
            <Button onClick={() => createApuMutation.mutate()}>
              <Plus className="mr-2 h-4 w-4" />
              Crear APU
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = [
    {
      key: 'materials',
      title: 'A. Materiales',
      icon: Package,
      total: apu.totalMaterials,
      items: apu.materials,
      onAdd: () => setAddMaterialOpen(true),
      columns: ['Descripcion', 'Unidad', 'Cantidad', 'Costo Unit.', 'Perdida %', 'Total'],
      renderRow: (item: (typeof apu.materials)[0]) => (
        <>
          <TableCell>{item.description}</TableCell>
          <TableCell>{item.unit}</TableCell>
          <TableCell className="text-right font-mono">
            {Number(item.quantity).toLocaleString('es-AR', { maximumFractionDigits: 4 })}
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(Number(item.unitCost))}
          </TableCell>
          <TableCell className="text-right font-mono">
            {(Number(item.wastePct) * 100).toFixed(1)}%
          </TableCell>
          <TableCell className="text-right font-mono font-medium">
            {formatCurrency(Number(item.totalCost))}
          </TableCell>
        </>
      ),
      deleteType: 'materials',
    },
    {
      key: 'labor',
      title: 'B. Mano de Obra',
      icon: Users,
      total: apu.totalLabor,
      items: apu.laborItems,
      onAdd: () => setAddLaborOpen(true),
      columns: ['Categoria', 'Hs/Hombre', 'Costo Horario', 'Total'],
      renderRow: (item: (typeof apu.laborItems)[0]) => (
        <>
          <TableCell>{item.category}</TableCell>
          <TableCell className="text-right font-mono">
            {Number(item.quantity).toLocaleString('es-AR', { maximumFractionDigits: 4 })}
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(Number(item.hourlyRate))}
          </TableCell>
          <TableCell className="text-right font-mono font-medium">
            {formatCurrency(Number(item.totalCost))}
          </TableCell>
        </>
      ),
      deleteType: 'labor',
    },
    {
      key: 'transport',
      title: 'C. Transporte',
      icon: Truck,
      total: apu.totalTransport,
      items: apu.transport,
      onAdd: () => setAddTransportOpen(true),
      columns: ['Descripcion', 'Unidad', 'Cantidad', 'Costo Unit.', 'Total'],
      renderRow: (item: (typeof apu.transport)[0]) => (
        <>
          <TableCell>{item.description}</TableCell>
          <TableCell>{item.unit}</TableCell>
          <TableCell className="text-right font-mono">
            {Number(item.quantity).toLocaleString('es-AR', { maximumFractionDigits: 4 })}
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(Number(item.unitCost))}
          </TableCell>
          <TableCell className="text-right font-mono font-medium">
            {formatCurrency(Number(item.totalCost))}
          </TableCell>
        </>
      ),
      deleteType: 'transport',
    },
    {
      key: 'equipment',
      title: 'D/E/F. Equipos',
      icon: Wrench,
      total: String(
        Number(apu.totalEquipAmort) + Number(apu.totalRepairs) + Number(apu.totalFuel)
      ),
      items: apu.equipment,
      onAdd: () => setAddEquipmentOpen(true),
      columns: ['Descripcion', 'Seccion', 'Horas', 'Costo/Hora', 'Total'],
      renderRow: (item: (typeof apu.equipment)[0]) => (
        <>
          <TableCell>{item.description}</TableCell>
          <TableCell>
            <Badge variant="outline">{item.section}</Badge>
          </TableCell>
          <TableCell className="text-right font-mono">
            {Number(item.hoursUsed).toLocaleString('es-AR', { maximumFractionDigits: 4 })}
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(Number(item.hourlyTotal))}
          </TableCell>
          <TableCell className="text-right font-mono font-medium">
            {formatCurrency(Number(item.totalCost))}
          </TableCell>
        </>
      ),
      deleteType: 'equipment',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${projectId}/budget-versions/${versionId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{apu.code}</Badge>
              <Badge variant="outline">{apu.budgetItem.number}</Badge>
            </div>
            <h1 className="text-3xl font-bold">APU: {apu.budgetItem.description}</h1>
            <p className="text-muted-foreground">
              {apu.budgetItem.unit} · Cantidad: {Number(apu.budgetItem.quantity).toLocaleString('es-AR')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => recalculateMutation.mutate()}
          disabled={recalculateMutation.isPending}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Recalcular
        </Button>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <Card key={section.key}>
          <Collapsible defaultOpen>
            <CardHeader className="pb-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <Badge variant="secondary" className="font-mono">
                    {formatCurrency(Number(section.total))}
                  </Badge>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {section.columns.map((col) => (
                        <TableHead
                          key={col}
                          className={
                            col !== 'Descripcion' && col !== 'Categoria' ? 'text-right' : ''
                          }
                        >
                          {col}
                        </TableHead>
                      ))}
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={section.columns.length + 1}
                          className="h-16 text-center text-muted-foreground"
                        >
                          Sin registros
                        </TableCell>
                      </TableRow>
                    ) : (
                      section.items.map((item: any) => (
                        <TableRow key={item.id}>
                          {section.renderRow(item)}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteItem(section.deleteType, item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <div className="p-3 border-t">
                  <Button size="sm" variant="outline" onClick={section.onAdd}>
                    <Plus className="mr-1 h-3 w-3" />
                    Agregar
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      {/* Summary */}
      <Card className="bg-primary/5">
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Materiales</p>
              <p className="font-bold font-mono">{formatCurrency(Number(apu.totalMaterials))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mano de Obra</p>
              <p className="font-bold font-mono">{formatCurrency(Number(apu.totalLabor))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transporte</p>
              <p className="font-bold font-mono">{formatCurrency(Number(apu.totalTransport))}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Equipos (D+E+F)</p>
              <p className="font-bold font-mono">
                {formatCurrency(
                  Number(apu.totalEquipAmort) + Number(apu.totalRepairs) + Number(apu.totalFuel)
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">Costo Directo Total</p>
            <p className="text-3xl font-bold text-primary font-mono">
              {formatCurrency(Number(apu.totalDirect))}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={addMaterialOpen} onOpenChange={setAddMaterialOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Material</DialogTitle>
          </DialogHeader>
          <ApuMaterialForm
            priceAnalysisId={apu.id}
            onSuccess={() => {
              setAddMaterialOpen(false);
              invalidate();
              toast.success('Material agregado');
            }}
            onCancel={() => setAddMaterialOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={addLaborOpen} onOpenChange={setAddLaborOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Mano de Obra</DialogTitle>
          </DialogHeader>
          <ApuLaborForm
            priceAnalysisId={apu.id}
            onSuccess={() => {
              setAddLaborOpen(false);
              invalidate();
              toast.success('Mano de obra agregada');
            }}
            onCancel={() => setAddLaborOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={addEquipmentOpen} onOpenChange={setAddEquipmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Equipo</DialogTitle>
          </DialogHeader>
          <ApuEquipmentForm
            priceAnalysisId={apu.id}
            onSuccess={() => {
              setAddEquipmentOpen(false);
              invalidate();
              toast.success('Equipo agregado');
            }}
            onCancel={() => setAddEquipmentOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={addTransportOpen} onOpenChange={setAddTransportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Transporte</DialogTitle>
          </DialogHeader>
          <ApuTransportForm
            priceAnalysisId={apu.id}
            onSuccess={() => {
              setAddTransportOpen(false);
              invalidate();
              toast.success('Transporte agregado');
            }}
            onCancel={() => setAddTransportOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
