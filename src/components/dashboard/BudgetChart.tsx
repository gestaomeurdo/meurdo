import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ChartData } from '@/hooks/use-dashboard-data';
import { formatCurrency } from '@/utils/formatters';

interface BudgetChartProps {
  data: ChartData[] | undefined;
  isLoading: boolean;
}

const BudgetChart = ({ data, isLoading }: BudgetChartProps) => {
  // Use formatCurrency utility with option to remove fraction digits for YAxis
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
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle>Orçamento vs. Gasto por Obra</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 70 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--foreground))" 
              angle={-45} 
              textAnchor="end" 
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--foreground))" 
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Orçamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gasto" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BudgetChart;