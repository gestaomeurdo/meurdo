import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      // 1. Total de Usuários
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // 2. Tickets Abertos
      const { count: openTickets } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open');
      
      // 3. Usuários Pro
      const { count: proCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan_type', 'pro');

      // 4. Atividades Recentes (usuários ativos)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: newUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('updated_at', thirtyDaysAgo.toISOString());

      return {
        totalUsers: userCount || 0,
        openTickets: openTickets || 0,
        proUsers: proCount || 0,
        recentActivity: newUsers || 0,
        estimatedRevenue: (proCount || 0) * 49.90
      };
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
};