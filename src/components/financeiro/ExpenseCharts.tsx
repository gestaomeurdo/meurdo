import { FinancialEntry } from "@/hooks/use-financial-entries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { useMemo } from "react";
import { format } from "date-fns";

interface ExpenseChartsProps {
  entries: FinancialEntry[] | undefined;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57'];

const ExpenseCharts = ({ entries }: ExpenseChartsProps) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  const { categoryData, monthlyData } = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { categoryData: [], monthlyData: [] };
    }

    // 1. Data for Pie Chart (Category Breakdown)
    const categoryMap = entries.reduce((acc, entry) => {
      const categoryName = entry.categorias_despesa?.nome || 'Outros';
      acc[categoryName] = (acc[categoryName] || 0) + entry.valor;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);

    // 2. Data for Line Chart (Monthly Evolution)
    const monthlyMap = entries.reduce((acc, entry) => {
      const monthKey = format(new Date(entry.data_gasto), 'yyyy-MM');
      acc[monthKey] = (acc[monthKey] || 0) + entry.valor;
      return acc;
    }, {} as Record<string, number>);

    const monthlyData = Object.entries(monthlyMap)
      .map(([key, value]) => ({
        name: format(new Date(key + '-01'), 'MMM/yy'),
        Gasto: value,
        sortKey: key,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return { categoryData, monthlyData };
  }, [entries]);

  if (!entries || entries.length === 0) {
    return null;
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
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {categoryData.map((_, index) => (
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
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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