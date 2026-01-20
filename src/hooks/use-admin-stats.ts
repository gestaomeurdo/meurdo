import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      try {
        // 1. Verificar se a conexão está ativa e e-mail é admin (proteção frontend)
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email !== 'robsonalixandree@gmail.com') {
            throw new Error("Usuário não autorizado para estatísticas admin.");
        }

        // 2. Consultas simplificadas e paralelas
        const [profilesRes, ticketsRes] = await Promise.all([
          supabase.from('profiles').select('id, plan_type', { count: 'exact', head: false }),
          supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open')
        ]);

        if (profilesRes.error) throw new Error("Erro profiles: " + profilesRes.error.message);
        if (ticketsRes.error) throw new Error("Erro tickets: " + ticketsRes.error.message);

        const proUsers = (profilesRes.data || []).filter(p => p.plan_type === 'pro').length;

        return {
          totalUsers: profilesRes.count || 0,
          openTickets: ticketsRes.count || 0,
          proUsers: proUsers,
          estimatedRevenue: proUsers * 49.90
        };
      } catch (error: any) {
        console.error("[useAdminStats] Falha crítica:", error.message);
        // Não mostramos toast aqui para não floodar a tela, a UI do dashboard já lida com o isError
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
    retry: 1, 
  });
};