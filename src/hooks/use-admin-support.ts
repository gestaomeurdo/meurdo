import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupportTicket, SupportMessage } from "./use-support";
import { showError } from "@/utils/toast";

export interface AdminTicket extends SupportTicket {
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    plan_type: string | null;
    subscription_status: string | null;
  };
}

export const useAdminTickets = () => {
  return useQuery<AdminTicket[], Error>({
    queryKey: ['adminTickets'],
    queryFn: async () => {
      // FORMA SEGURA DE BUSCAR: Try/Catch e tratamento de dados nulos
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select(`
            *,
            profiles (first_name, last_name, email, plan_type, subscription_status)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        // PROTEÇÃO CONTRA PERFIL NULO
        // Se o usuário foi deletado ou o join falhou, injeta valores padrão para não quebrar a UI
        return (data || []).map(ticket => ({
          ...ticket,
          profiles: ticket.profiles || {
            first_name: 'Usuário',
            last_name: 'Desconhecido',
            email: 'N/A',
            plan_type: 'FREE',
            subscription_status: 'inactive'
          }
        })) as AdminTicket[];
      } catch (err: any) {
        console.error("[useAdminTickets] Erro crítico:", err.message);
        showError("Falha ao carregar chamados. Verifique as permissões de Admin.");
        throw err;
      }
    },
    staleTime: 1000 * 30, // 30 segundos
  });
};

export const useAdminTicketMessages = (ticketId?: string) => {
  return useQuery<SupportMessage[], Error>({
    queryKey: ['adminTicketMessages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as SupportMessage[];
    },
    enabled: !!ticketId,
  });
};

export const useAdminReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticketId, sender_role: 'support', message });
      
      if (msgError) throw msgError;

      await supabase
        .from('support_tickets')
        .update({ status: 'resolved' }) 
        .eq('id', ticketId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminTicketMessages', variables.ticketId] });
    },
  });
};

export const useAdminUpdateStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string, status: any }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminTickets'] }),
  });
};