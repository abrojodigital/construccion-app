'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculateAdjustmentSchema } from '@construccion/shared/validators';
import { api } from '@/lib/api';

type FormValues = z.infer<typeof calculateAdjustmentSchema>;

interface AdjustmentFormula {
  id: string;
  name: string;
  budgetVersion?: { name: string; code: string };
}

interface Props {
  onSubmit: (data: FormValues) => Promise<void>;
}

export function CalculateAdjustmentForm({ onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(calculateAdjustmentSchema),
    defaultValues: {
      formulaId: '',
    },
  });

  const { data: formulas } = useQuery({
    queryKey: ['adjustment-formulas'],
    queryFn: () => api.get<AdjustmentFormula[]>('/adjustments/formulas'),
  });

  const formulaList = Array.isArray(formulas) ? formulas : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Formula de Ajuste *</label>
        <Select onValueChange={(val) => setValue('formulaId', val)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar formula" />
          </SelectTrigger>
          <SelectContent>
            {formulaList.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
                {f.budgetVersion && ` (${f.budgetVersion.code})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.formulaId && (
          <p className="text-sm text-destructive">{errors.formulaId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha Base *</label>
          <Input type="date" {...register('baseDate')} />
          {errors.baseDate && (
            <p className="text-sm text-destructive">{errors.baseDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fecha Actual *</label>
          <Input type="date" {...register('currentDate')} />
          {errors.currentDate && (
            <p className="text-sm text-destructive">{errors.currentDate.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Calculando...' : 'Calcular Factor de Ajuste'}
      </Button>
    </form>
  );
}
