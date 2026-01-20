import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      try {
        // Consultas simplificadas para testar RLS individualmente
        const { count: userCount, error: err1 } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true });
        
        if (err1) throw new Error("Erro ao ler Perfis: " + err1.message);

        const { count: openTickets, error: err2 } = await supabase
            .from('support_tickets')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'open');
        
        if (err2) throw new Error("Erro ao ler Tickets: " + err2.message);
        
        const { count: proCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('plan_type', 'pro');

        return {
          totalUsers: userCount || 0,
          openTickets: openTickets || 0,
          proUsers: proCount || 0,
          estimatedRevenue: (proCount || 0) * 49.90
        };
      } catch (error: any) {
        console.error("[useAdminStats] Falha crítica:", error.message);
        showError("Erro de Permissão (RLS): O banco bloqueou a consulta.");
        throw error; // Tanstack Query lida com o estado de erro
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1, // Não tenta muitas vezes se for erro de permissão
  });
};