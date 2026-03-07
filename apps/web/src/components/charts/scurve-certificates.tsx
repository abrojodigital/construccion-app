'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface SCurvePoint {
  mes: string;
  mensual: number;
  acumulado: number;
}

interface Props {
  data: SCurvePoint[];
}

const arsCurrency = (v: number, compact = false) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(v);

export function SCurveCertificates({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 8, right: 80, left: 80, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis
          yAxisId="mensual"
          orientation="right"
          tickFormatter={(v) => arsCurrency(v, true)}
          tick={{ fontSize: 11 }}
          width={75}
        />
        <YAxis
          yAxisId="acumulado"
          orientation="left"
          tickFormatter={(v) => arsCurrency(v, true)}
          tick={{ fontSize: 11 }}
          width={75}
        />
        <Tooltip
          formatter={(value: number, name: string) => [arsCurrency(value), name]}
        />
        <Legend />
        <Bar
          yAxisId="mensual"
          dataKey="mensual"
          name="Mensual"
          fill="#6366f1"
          fillOpacity={0.6}
          radius={[3, 3, 0, 0]}
        />
        <Line
          yAxisId="acumulado"
          type="monotone"
          dataKey="acumulado"
          name="Acumulado"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
