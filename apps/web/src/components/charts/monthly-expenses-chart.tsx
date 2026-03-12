'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface MonthlyExpense {
  month: string;
  amount: number;
}

interface Props {
  data: MonthlyExpense[];
}

const compact = (v: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);

const full = (v: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(v);

function CustomTooltip({ active, payload, label, bg, text }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md border border-border px-3 py-2 text-xs shadow-lg"
      style={{ background: bg, color: text }}
    >
      <p className="font-semibold mb-1">{label}</p>
      <p>{full(payload[0].value)}</p>
    </div>
  );
}

export function MonthlyExpensesChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const colors = useMemo(
    () => ({
      bar: isDark ? '#f5a420' : '#d97706',
      barHover: isDark ? '#fbbf24' : '#b45309',
      grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
      axis: isDark ? '#6b7280' : '#9ca3af',
      tooltipBg: isDark ? '#1a2236' : '#ffffff',
      tooltipText: isDark ? '#e2e8f0' : '#1a202c',
    }),
    [isDark]
  );

  const hasData = data.some((d) => d.amount > 0);

  if (!data.length || !hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Sin gastos aprobados o pagados en los últimos 12 meses
      </div>
    );
  }

  // Average line
  const avg = data.reduce((s, d) => s + d.amount, 0) / data.length;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: colors.axis }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={compact}
          tick={{ fontSize: 11, fill: colors.axis }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          content={
            <CustomTooltip bg={colors.tooltipBg} text={colors.tooltipText} />
          }
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        />
        <ReferenceLine
          y={avg}
          stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
          strokeDasharray="4 4"
          label={{
            value: `Prom: ${compact(avg)}`,
            position: 'insideTopRight',
            fontSize: 10,
            fill: colors.axis,
          }}
        />
        <Bar
          dataKey="amount"
          name="Gasto"
          fill={colors.bar}
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
