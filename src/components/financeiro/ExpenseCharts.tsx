import { FinancialEntry, FinancialEntriesResult } from "@/hooks/use-financial-entries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useMemo } from "react";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { Loader2 } from "lucide-react"; // Importando Loader2

interface ExpenseChartsProps {
  entriesResult: FinancialEntriesResult | undefined;
  isLoading: boolean; // Novo prop
}

// Cores mais vibrantes e acessíveis para o tema escuro
const COLORS = ['#FF7A00', '#00C49F', '#FFBB28', '#0088FE', '#8884d8', '#FF8042', '#82ca9d', '#ffc658', '#d0ed57'];

const ExpenseCharts = ({ entriesResult, isLoading }: ExpenseChartsProps) => {
  const entries = entriesResult?.entries;
  
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </Card>
        <Card className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </Card>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return null;
  }

  // Custom Tooltip Content for Pie Chart to show percentage
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = categoryData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="p-2 bg-card border border-border rounded-md shadow-lg text-sm text-foreground">
          <p className="font-semibold text-primary">{data.name}</p>
          <p>Valor: {formatCurrency(data.value)}</p>
          <p>Percentual: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Gráfico de Rosca (Donut Chart): Gastos por Categoria */}
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
                innerRadius={60} // Donut Chart
                outerRadius={100}
                fill="#8884d8"
                label={false} 
                labelLine={false}
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={<CustomTooltip />}
                wrapperStyle={{ outline: 'none' }}
              />
              {/* Legenda na parte inferior para melhor visualização */}
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
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
                tickFormatter={(value: number) => formatCurrency(value, { maximumFractionDigits: 0 })}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                // Adicionando a classe text-foreground ao wrapper do Tooltip do LineChart
                wrapperClassName="text-foreground"
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