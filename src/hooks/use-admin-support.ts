import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupportTicket, SupportMessage } from "./use-support";
import { showError } from "@/utils/toast";

export interface AdminTicket extends SupportTicket {
  user_name: string;
  user_email: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    plan_type: string | null;
  } | null;
}

export const useAdminTickets = () => {
  return useQuery<AdminTicket[], Error>({
    queryKey: ['adminTickets'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('support_tickets')
          .select(`
            *,
            profiles ( first_name, last_name, email, plan_type )
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;

        // Mapeamento robusto com fallbacks para evitar crash se o join falhar
        return (data || []).map(ticket => {
          const profile = ticket.profiles;
          return {
            ...ticket,
            user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário Sem Nome' : 'Usuário Desconhecido',
            user_email: profile?.email || 'Email não encontrado',
            profiles: profile
          };
        }) as AdminTicket[];
      } catch (err: any) {
        console.error("[useAdminTickets] Erro crítico:", err.message);
        throw err;
      }
    },
    staleTime: 1000 * 30,
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