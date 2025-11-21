import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { name: 'Jan', Orçamento: 400000 },
  { name: 'Fev', Orçamento: 300000 },
  { name: 'Mar', Orçamento: 200000 },
  { name: 'Abr', Orçamento: 278000 },
  { name: 'Mai', Orçamento: 189000 },
  { name: 'Jun', Orçamento: 239000 },
];

const BudgetChart = () => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle>Visão Geral do Orçamento (Simulação)</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
            <YAxis 
              stroke="hsl(var(--foreground))" 
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
              formatter={(value: number) => [formatCurrency(value), 'Orçamento']}
            />
            <Bar dataKey="Orçamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BudgetChart;