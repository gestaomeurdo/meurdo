"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "next-themes";

interface WorkforceEvolutionChartProps {
  rdos: any[];
  isLoading: boolean;
}

const WorkforceEvolutionChart = ({ rdos, isLoading }: WorkforceEvolutionChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = useMemo(() => {
    if (!rdos) return [];
    
    return [...rdos]
      .sort((a, b) => a.data_rdo.localeCompare(b.data_rdo))
      .map(rdo => ({
        date: format(parseISO(rdo.data_rdo), "dd/MM"),
        fullDate: format(parseISO(rdo.data_rdo), "dd 'de' MMMM", { locale: ptBR }),
        efetivo: rdo.rdo_mao_de_obra?.reduce((sum: number, m: any) => sum + (m.quantidade || 0), 0) || 0
      }));
  }, [rdos]);

  if (isLoading) {
    return (
      <Card className="h-[450px] flex items-center justify-center border-none shadow-clean rounded-[2rem]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="h-full border-none shadow-clean rounded-[2rem] bg-card overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Users className="w-4 h-4" /> Evolução do Efetivo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8 h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEfetivo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#066abc" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#066abc" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#e2e8f0"} vertical={false} />
            <XAxis 
              dataKey="date" 
              fontSize={10} 
              fontWeight="bold" 
              axisLine={false} 
              tickLine={false} 
              stroke={isDark ? "#94a3b8" : "#64748b"} 
            />
            <YAxis 
              fontSize={10} 
              fontWeight="bold" 
              axisLine={false} 
              tickLine={false} 
              stroke={isDark ? "#94a3b8" : "#64748b"} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                border: 'none', 
                borderRadius: '1rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
              }}
              labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#066abc', marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="efetivo" 
              name="Homens-Dia" 
              stroke="#066abc" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorEfetivo)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WorkforceEvolutionChart;