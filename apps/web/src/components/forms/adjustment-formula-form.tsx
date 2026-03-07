'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createAdjustmentFormulaSchema } from '@construccion/shared/validators';
import { api } from '@/lib/api';

type FormValues = z.infer<typeof createAdjustmentFormulaSchema>;

interface PriceIndex {
  id: string;
  name: string;
  code: string;
}

interface BudgetVersion {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface Props {
  projectId: string;
  onSubmit: (data: FormValues) => Promise<void>;
  onCancel?: () => void;
}

export function AdjustmentFormulaForm({ projectId, onSubmit, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createAdjustmentFormulaSchema),
    defaultValues: {
      name: '',
      budgetVersionId: '',
      weights: [{ component: '', weight: 0, priceIndexId: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'weights',
  });

  const weights = watch('weights');
  const totalWeight = weights?.reduce((sum, w) => sum + (Number(w.weight) || 0), 0) || 0;

  const { data: indices } = useQuery({
    queryKey: ['price-indices'],
    queryFn: () => api.get<PriceIndex[]>('/adjustments/indices'),
  });

  const { data: versions } = useQuery({
    queryKey: ['budget-versions', projectId],
    queryFn: () =>
      api.get<{ data: BudgetVersion[] }>(
        `/projects/${projectId}/budget-versions?limit=100&status=APPROVED`
      ),
  });

  const indexList = Array.isArray(indices) ? indices : [];
  const versionList = versions?.data ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre de la Formula *</label>
          <Input {...register('name')} placeholder="Ej: Formula polinomica Decreto 1295" />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Version de Presupuesto *</label>
          <Select onValueChange={(val) => setValue('budgetVersionId', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar version aprobada" />
            </SelectTrigger>
            <SelectContent>
              {versionList.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name} ({v.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.budgetVersionId && (
            <p className="text-sm text-destructive">{errors.budgetVersionId.message}</p>
          )}
        </div>
      </div>

      {/* Weights / Components */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Componentes de la Formula</h3>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-mono ${
                Math.abs(totalWeight - 1) < 0.002
                  ? 'text-green-600'
                  : 'text-destructive'
              }`}
            >
              Peso total: {(totalWeight * 100).toFixed(1)}%
              {Math.abs(totalWeight - 1) >= 0.002 && ' (debe ser 100%)'}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => append({ component: '', weight: 0, priceIndexId: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>
        </div>

        {errors.weights?.root && (
          <p className="text-sm text-destructive">{errors.weights.root.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-4 space-y-1">
                {index === 0 && (
                  <label className="text-xs text-muted-foreground">Componente</label>
                )}
                <Input
                  {...register(`weights.${index}.component`)}
                  placeholder="Ej: Materiales"
                />
                {errors.weights?.[index]?.component && (
                  <p className="text-xs text-destructive">
                    {errors.weights[index]?.component?.message}
                  </p>
                )}
              </div>
              <div className="col-span-2 space-y-1">
                {index === 0 && (
                  <label className="text-xs text-muted-foreground">Peso (0-1)</label>
                )}
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  {...register(`weights.${index}.weight`, { valueAsNumber: true })}
                  placeholder="0.45"
                />
                {errors.weights?.[index]?.weight && (
                  <p className="text-xs text-destructive">
                    {errors.weights[index]?.weight?.message}
                  </p>
                )}
              </div>
              <div className="col-span-5 space-y-1">
                {index === 0 && (
                  <label className="text-xs text-muted-foreground">Indice de Precios</label>
                )}
                <Select
                  onValueChange={(val) => setValue(`weights.${index}.priceIndexId`, val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar indice" />
                  </SelectTrigger>
                  <SelectContent>
                    {indexList.map((idx) => (
                      <SelectItem key={idx.id} value={idx.id}>
                        {idx.name} ({idx.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.weights?.[index]?.priceIndexId && (
                  <p className="text-xs text-destructive">
                    {errors.weights[index]?.priceIndexId?.message}
                  </p>
                )}
              </div>
              <div className="col-span-1 flex items-end">
                {index === 0 && <div className="h-5" />}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Crear Formula'}
        </Button>
      </div>
    </form>
  );
}
