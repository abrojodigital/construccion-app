'use client';

import { useTheme } from 'next-themes';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StatusEntry {
  status: string;
  count: number;
  label: string;
}

interface Props {
  data: StatusEntry[];
}

const STATUS_COLORS_DARK: Record<string, string> = {
  PLANNING: '#3b82f6',
  IN_PROGRESS: '#f5a420',
  ON_HOLD: '#a78bfa',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
};

const STATUS_COLORS_LIGHT: Record<string, string> = {
  PLANNING: '#2563eb',
  IN_PROGRESS: '#d97706',
  ON_HOLD: '#7c3aed',
  COMPLETED: '#16a34a',
  CANCELLED: '#dc2626',
};

function CustomTooltip({ active, payload, bg, text }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div
      className="rounded-md border border-border px-3 py-2 text-xs shadow-lg"
      style={{ background: bg, color: text }}
    >
      <p className="font-semibold">{name}</p>
      <p>{value} proyecto{value !== 1 ? 's' : ''}</p>
    </div>
  );
}

function CustomLegend({ payload }: any) {
  return (
    <ul className="flex flex-col gap-1.5 mt-2">
      {payload?.map((entry: any) => (
        <li key={entry.value} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span>{entry.value}</span>
          <span className="ml-auto font-medium text-foreground">{entry.payload.count}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProjectStatusChart({ data }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const COLORS = isDark ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT;

  const tooltipBg = isDark ? '#1a2236' : '#ffffff';
  const tooltipText = isDark ? '#e2e8f0' : '#1a202c';

  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Sin proyectos registrados
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={3}
            dataKey="count"
            nameKey="label"
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={COLORS[entry.status] ?? '#6b7280'}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip bg={tooltipBg} text={tooltipText} />}
          />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
