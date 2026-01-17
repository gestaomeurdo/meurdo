import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Briefcase, Handshake } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from "react";
import { format, parseISO, isSameMonth, isSameYear } from "date-fns";
import { DiarioObra } from "@/hooks/use-rdo";
import { formatCurrency } from "@/utils/formatters";

interface RdoDashboardProps {
  rdoList: DiarioObra[];
  currentDate: Date;
  isLoading: boolean;
}

const RdoDashboard = ({ rdoList, currentDate, isLoading }: RdoDashboardProps) => {
  const currentMonthRdos = useMemo(() => {
    return rdoList.filter(rdo => {
      const rdoDate = parseISO(rdo.data_rdo);
      return isSameMonth(rdoDate, currentDate) && isSameYear(rdoDate, currentDate);
    });
  }, [rdoList, currentDate]);

  const { totalCost, ownTeamCost, outsourcedCost } = useMemo(() => {
    let total = 0;
    let own = 0;
    let outsourced = 0;
    
    currentMonthRdos.forEach(rdo => {
      rdo.rdo_mao_de_obra?.forEach(m => {
        const cost = m.quantidade * (m.custo_unitario || 0);
        total += cost;
        if (m.tipo === 'Própria') {
          own += cost;
        } else if (m.tipo === 'Terceirizada') {
          outsourced += cost;
        } else {
            // Default to own if undefined
            own += cost;
        }
      });
    });
    
    return { totalCost: total, ownTeamCost: own, outsourcedCost: outsourced };
  }, [currentMonthRdos]);

  const averageWorkforce = useMemo(() => {
    if (currentMonthRdos.length === 0) return 0;
    const totalWorkers = currentMonthRdos.reduce((sum, rdo) => {
      return sum + (rdo.rdo_mao_de_obra?.reduce((mSum, m) => mSum + m.quantidade, 0) || 0);
    }, 0);
    return Math.round(totalWorkers / currentMonthRdos.length);
  }, [currentMonthRdos]);

  const rainDays = useMemo(() => {
    return currentMonthRdos.filter(rdo => rdo.clima_condicoes?.includes('Chuva')).length;
  }, [currentMonthRdos]);

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      return date;
    }).reverse();

    return last7Days.map(day => {
      const dayRdos = currentMonthRdos.filter(rdo => {
        const rdoDate = parseISO(rdo.data_rdo);
        return rdoDate.toDateString() === day.toDateString();
      });

      const dailyCost = dayRdos.reduce((sum, rdo) => {
        const manpowerCost = rdo.rdo_mao_de_obra?.reduce((mSum, m) => mSum + (m.quantidade * (m.custo_unitario || 0)), 0) || 0;
        return sum + manpowerCost;
      }, 0);

      return {
        date: format(day, 'dd/MM'),
        cost: dailyCost,
      };
    });
  }, [currentMonthRdos, currentDate]);

  // Fix NaN percentage calculation
  const ownPercentage = totalCost > 0 ? ((ownTeamCost / totalCost) * 100).toFixed(0) : "0";
  const outsourcedPercentage = totalCost > 0 ? ((outsourcedCost / totalCost) * 100).toFixed(0) : "0";

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total Mão de Obra (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalCost > 10000 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(totalCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonthRdos.length} dias registrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Equipe Própria</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(ownTeamCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {ownPercentage}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Terceirizada</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(outsourcedCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {outsourcedPercentage}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Efetivo na Obra</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageWorkforce} funcionários</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dias de chuva: {rainDays}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evolução de Custos - Últimos 7 Dias</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" stroke="hsl(var(--foreground))" />
              <YAxis
                stroke="hsl(var(--foreground))"
                tickFormatter={(value: number) => formatCurrency(value, { maximumFractionDigits: 0 })}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
                formatter={(value: number) => [formatCurrency(value), 'Custo Diário']}
              />
              <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RdoDashboard;