import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface ExpenseChartsProps {
  data: {
    categoryData: { name: string; value: number }[];
    monthlyData: { name: string; Gasto: number }[];
  } | undefined;
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

const ExpenseCharts = ({ data, isLoading }: ExpenseChartsProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  const formattedMonthlyData = data?.monthlyData.map(item => ({
    ...item,
    name: format(new Date(item.name + '-02'), 'MMM/yy', { locale: ptBR }), // Use day 02 to avoid timezone issues
  }));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Gastos por Categoria</CardTitle></CardHeader>
          <CardContent className="h-[350px] flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Evolução Mensal dos Gastos</CardTitle></CardHeader>
          <CardContent className="h-[350px] flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || (data.categoryData.length === 0 && data.monthlyData.length === 0)) {
    return null; // Don't render empty charts
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gráfico de Pizza: Gastos por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {data.categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
              />
              <Legend layout="vertical" align="right" verticalAlign="middle" />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Linha: Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução Mensal dos Gastos</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedMonthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
              <YAxis 
                stroke="hsl(var(--foreground))" 
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                formatter={(value: number) => [formatCurrency(value), 'Gasto']}
              />
              <Line type="monotone" dataKey="Gasto" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseCharts;