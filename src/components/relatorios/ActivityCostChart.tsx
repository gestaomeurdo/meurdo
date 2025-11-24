import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Atividade } from '@/hooks/use-atividades';
import { useMemo } from 'react';
import { format } from 'date-fns';

interface ActivityCostChartProps {
  activities: Atividade[] | undefined;
  isLoading: boolean;
}

const ActivityCostChart = ({ activities, isLoading }: ActivityCostChartProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  const chartData = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    const monthlyMap = activities.reduce((acc, activity) => {
      const monthKey = format(new Date(activity.data_atividade), 'yyyy-MM');
      const pedagio = activity.pedagio || 0;
      const kmRodado = activity.km_rodado || 0;

      acc[monthKey] = acc[monthKey] || { Pedágio: 0, 'KM Rodado': 0, name: format(new Date(monthKey + '-01'), 'MMM/yy'), sortKey: monthKey };
      
      acc[monthKey].Pedágio += pedagio;
      acc[monthKey]['KM Rodado'] += kmRodado;
      
      return acc;
    }, {} as Record<string, { Pedágio: number, 'KM Rodado': number, name: string, sortKey: string }>);

    return Object.values(monthlyMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [activities]);

  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Custos de Atividades por Mês</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Custos de Atividades por Mês</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4 flex justify-center items-center">
          <p className="text-muted-foreground">Nenhuma atividade com custos registrada no período.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Custos de Atividades por Mês</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
            <YAxis 
              yAxisId="left" 
              stroke="hsl(var(--foreground))" 
              tickFormatter={formatCurrency}
              label={{ value: 'Pedágio (R$)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))' } }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="hsl(var(--muted-foreground))" 
              label={{ value: 'KM Rodado', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' } }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
              formatter={(value: number, name: string) => {
                if (name === 'Pedágio') return [formatCurrency(value), name];
                return [`${value} km`, name];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar yAxisId="left" dataKey="Pedágio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="KM Rodado" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ActivityCostChart;