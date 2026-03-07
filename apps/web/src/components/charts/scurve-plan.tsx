'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface SCurvePoint {
  label: string;
  proyectado: number;
  certificado: number | null;
}

interface Props {
  data: SCurvePoint[];
}

const arsCurrency = (v: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v);

export function SCurvePlan({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis tickFormatter={arsCurrency} tick={{ fontSize: 11 }} width={80} />
        <Tooltip
          formatter={(value: number, name: string) => [
            new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value),
            name,
          ]}
          labelFormatter={(label) => `Período: ${label}`}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="proyectado"
          name="Planificado"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.08}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="certificado"
          name="Certificado"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
