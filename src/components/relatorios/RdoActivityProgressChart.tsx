import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { RdoReportMetrics } from '@/hooks/use-rdo-report-data';
import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface RdoActivityProgressChartProps {
  metrics: RdoReportMetrics | undefined;
  isLoading: boolean;
}

const COLORS = {
    'Concluídas': '#066abc', // Primary Blue
    'Pendentes': '#FFBB28', // Yellow/Orange for warning
};

const RdoActivityProgressChart = ({ metrics, isLoading }: RdoActivityProgressChartProps) => {
  const isMobile = useIsMobile();

  const chartData = useMemo(() => {
    if (!metrics) return [];
    
    const completed = metrics.completedActivitiesCount;
    
    // Calculate total activities recorded in all RDOs
    const totalActivities = metrics.allRdos.reduce((sum, rdo) => {
        return sum + (rdo.rdo_atividades_detalhe?.length || 0);
    }, 0);
    
    const pending = totalActivities - completed;

    if (totalActivities === 0) return [];

    return [
        { name: 'Concluídas', value: completed, icon: CheckCircle },
        { name: 'Pendentes', value: pending, icon: Clock },
    ].filter(item => item.value > 0);
  }, [metrics]);

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Progresso das Atividades</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Progresso das Atividades</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4 flex justify-center items-center">
          <p className="text-muted-foreground">Nenhuma atividade registrada no período.</p>
        </CardContent>
      </Card>
    );
  }
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      
      return (
        <div className="p-3 bg-card border border-border rounded-md shadow-lg text-xs sm:text-sm text-foreground">
          <p className="font-semibold text-primary">{data.name}</p>
          <p>Total: {data.value}</p>
          <p>Percentual: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Progresso das Atividades</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 40 : 60}
              outerRadius={isMobile ? 80 : 120}
              fill="#8884d8"
              label={false}
              labelLine={false}
              paddingAngle={1}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.name as keyof typeof COLORS]} 
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip />} 
              wrapperStyle={{ outline: 'none' }} 
              isAnimationActive={false}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right" 
              iconType="circle" 
              wrapperStyle={{ 
                paddingLeft: '20px', 
                fontSize: isMobile ? '10px' : '12px',
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RdoActivityProgressChart;