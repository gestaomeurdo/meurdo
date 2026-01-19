import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ChartData } from '@/hooks/use-dashboard-data';
import { formatCurrency } from '@/utils/formatters';
import { useTheme } from 'next-themes';

interface BudgetChartProps {
  data: ChartData[] | undefined;
  isLoading: boolean;
}

const BudgetChart = ({ data, isLoading }: BudgetChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatYAxis = (value: number) => formatCurrency(value, { maximumFractionDigits: 0 });

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-4">
        <CardHeader>
          <CardTitle>Orçamento vs. Gasto por Obra</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="col-span-full lg:col-span-4">
        <CardHeader>
          <CardTitle>Orçamento vs. Gasto por Obra</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4 flex justify-center items-center">
          <p className="text-muted-foreground">Nenhuma obra cadastrada para exibir o gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-4 border-slate-200 dark:border-slate-800">
      <CardHeader>
        <CardTitle>Orçamento vs. Gasto por Obra</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} />
            <XAxis 
              dataKey="name" 
              stroke={isDark ? "#94a3b8" : "#64748b"} 
              angle={-45} 
              textAnchor="end" 
              interval={0}
              tick={{ fontSize: 10, fontWeight: 500 }}
            />
            <YAxis 
              stroke={isDark ? "#94a3b8" : "#64748b"} 
              tickFormatter={formatYAxis}
              tick={{ fontSize: 10, fontWeight: 500 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                borderRadius: '0.75rem',
                color: isDark ? '#f8fafc' : '#0f172a'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
            <Bar dataKey="Orçamento" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gasto" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BudgetChart;