'use client';

import { useTheme } from 'next-themes';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

interface ProjectProgress {
  project: string;
  code: string;
  progress: number;
  budget: number;
  spent: number;
}

interface Props {
  data: ProjectProgress[];
}

const pct = (v: number) => `${v}%`;

const compact = (v: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);

function CustomTooltip({ active, payload, label, bg, text }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md border border-border px-3 py-2.5 text-xs shadow-lg min-w-40"
      style={{ background: bg, color: text }}
    >
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium">{p.name === 'Avance' ? pct(p.value) : compact(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ProjectProgressChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const colors = {
    progress: isDark ? '#f5a420' : '#d97706',
    budget: isDark ? '#3b82f6' : '#2563eb',
    spent: isDark ? '#22c55e' : '#16a34a',
    spentOver: isDark ? '#ef4444' : '#dc2626',
    grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    axis: isDark ? '#6b7280' : '#9ca3af',
    tooltipBg: isDark ? '#1a2236' : '#ffffff',
    tooltipText: isDark ? '#e2e8f0' : '#1a202c',
  };

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Sin proyectos activos
      </div>
    );
  }

  // Truncate long names for axis
  const chartData = data.map((d) => ({
    ...d,
    label: d.code,
    ejecucion: d.budget > 0 ? Math.round((d.spent / d.budget) * 100) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 52)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        barCategoryGap="30%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={pct}
          tick={{ fontSize: 11, fill: colors.axis }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fontSize: 11, fill: colors.axis }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          content={<CustomTooltip bg={colors.tooltipBg} text={colors.tooltipText} />}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="progress" name="Avance físico" fill={colors.progress} radius={[0, 3, 3, 0]} maxBarSize={14}>
          {chartData.map((entry) => (
            <Cell key={entry.code} fill={colors.progress} />
          ))}
        </Bar>
        <Bar dataKey="ejecucion" name="Ejecución presup." radius={[0, 3, 3, 0]} maxBarSize={14}>
          {chartData.map((entry) => (
            <Cell
              key={entry.code}
              fill={entry.ejecucion > 90 ? colors.spentOver : colors.budget}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
