'use client';

import { BarChart3 } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyExpense {
  month: string;
  amount: number;
}

interface Props {
  isLoading: boolean;
  monthlyExpenses: MonthlyExpense[];
}

const arsCurrency = (v: number, compact = false) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(v);

export function InvestmentCurve({ isLoading, monthlyExpenses }: Props) {
  let cumulative = 0;
  const chartData = monthlyExpenses.map((item) => {
    cumulative += item.amount;
    return { mes: item.month, Mensual: item.amount, Acumulado: cumulative };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Curva de Inversión</CardTitle>
        <CardDescription>Gastos mensuales (barras) y acumulado (línea S)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-72 animate-pulse bg-muted rounded-lg" />
        ) : chartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No hay datos para mostrar</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 80, left: 80, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="mensual"
                orientation="right"
                tickFormatter={(v) => arsCurrency(v, true)}
                tick={{ fontSize: 11 }}
                width={75}
                label={{ value: 'Mensual', angle: 90, position: 'insideRight', offset: 10, fontSize: 11, fill: '#6366f1' }}
              />
              <YAxis
                yAxisId="acumulado"
                orientation="left"
                tickFormatter={(v) => arsCurrency(v, true)}
                tick={{ fontSize: 11 }}
                width={75}
                label={{ value: 'Acumulado', angle: -90, position: 'insideLeft', offset: -10, fontSize: 11, fill: '#22c55e' }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [arsCurrency(value), name]}
                labelFormatter={(label) => `Mes: ${label}`}
              />
              <Legend />
              <Bar
                yAxisId="mensual"
                dataKey="Mensual"
                fill="#6366f1"
                fillOpacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="acumulado"
                type="monotone"
                dataKey="Acumulado"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                activeDot={{ r: 7 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
