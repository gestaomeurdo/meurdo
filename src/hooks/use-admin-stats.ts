import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      // 1. Verifica no banco se o usuário atual tem permissão de admin
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (user?.email !== 'robsonalixandree@gmail.com' && profile?.role !== 'administrator') {
          throw new Error("Usuário não autorizado para estatísticas admin.");
      }

      const [profilesRes, ticketsRes] = await Promise.all([
        supabase.from('profiles').select('id, plan_type', { count: 'exact', head: false }),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (ticketsRes.error) throw ticketsRes.error;

      const proUsers = (profilesRes.data || []).filter(p => p.plan_type === 'pro').length;

      return {
        totalUsers: profilesRes.count || 0,
        openTickets: ticketsRes.count || 0,
        proUsers: proUsers,
        estimatedRevenue: proUsers * 49.90
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};