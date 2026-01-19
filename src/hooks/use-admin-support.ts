import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupportTicket, SupportMessage } from "./use-support";

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
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles (first_name, last_name, email, plan_type, subscription_status)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
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
      // 1. Inserir resposta do suporte
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticketId, sender_role: 'support', message });
      
      if (msgError) throw msgError;

      // 2. Atualizar status do ticket para 'resolved' (ou custom 'answered' se preferir)
      // Vou usar 'resolved' para simplificar o schema original ou manter conforme prompt
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({ status: 'resolved' }) 
        .eq('id', ticketId);

      if (ticketError) throw ticketError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] });
      queryClient.invalidateQueries({ queryKey: ['adminTicketMessages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] }); // Para o usuário ver o feedback
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