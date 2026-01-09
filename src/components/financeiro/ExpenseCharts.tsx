import { FinancialEntry, FinancialEntriesResult } from "@/hooks/use-financial-entries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/utils/formatters";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExpenseChartsProps {
  entriesResult: FinancialEntriesResult | undefined;
  isLoading: boolean;
}

const COLORS = ['#FF7A00', '#00C49F', '#FFBB28', '#0088FE', '#8884d8', '#FF8042', '#82ca9d', '#ffc658', '#d0ed57'];

const ExpenseCharts = ({ entriesResult, isLoading }: ExpenseChartsProps) => {
  const entries = entriesResult?.entries;
  const isMobile = useIsMobile();
  
  const { categoryData, monthlyData } = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { categoryData: [], monthlyData: [] };
    }

    const categoryMap = entries.reduce((acc, entry) => {
      const categoryName = entry.categorias_despesa?.nome || 'Outros';
      acc[categoryName] = (acc[categoryName] || 0) + entry.valor;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);

    const monthlyMap = entries.reduce((acc, entry) => {
      const monthKey = format(new Date(entry.data_gasto), 'yyyy-MM');
      acc[monthKey] = (acc[monthKey] || 0) + entry.valor;
      return acc;
    }, {} as Record<string, number>);

    const monthlyData = Object.entries(monthlyMap)
      .map(([key, value]) => ({
        name: format(new Date(key + '-01'), 'MMM/yy', { locale: ptBR }),
        Gasto: value,
        sortKey: key,
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return { categoryData, monthlyData };
  }, [entries]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-[300px] sm:h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </Card>
        <Card className="h-[300px] sm:h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </Card>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = categoryData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="p-2 bg-card border border-border rounded-md shadow-lg text-xs sm:text-sm text-foreground">
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
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[350px] p-2 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 45 : 60}
                outerRadius={isMobile ? 70 : 100}
                fill="#8884d8"
                label={false} 
                labelLine={false}
                paddingAngle={2}
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={<CustomTooltip />}
                wrapperStyle={{ outline: 'none' }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center" 
                iconType="circle"
                wrapperStyle={{ 
                  paddingTop: '10px',
                  fontSize: isMobile ? '10px' : '12px',
                  lineHeight: '14px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] sm:h-[350px] p-2 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--foreground))" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--foreground))" 
                fontSize={10}
                tickFormatter={(value: number) => formatCurrency(value, { maximumFractionDigits: 0, style: 'decimal' })}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem', fontSize: '12px' }}
                formatter={(value: number) => [formatCurrency(value), 'Gasto']}
                wrapperClassName="text-foreground"
              />
              <Line type="monotone" dataKey="Gasto" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseCharts;