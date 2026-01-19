import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SenderRole = 'user' | 'support';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  created_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_role: SenderRole;
  message: string;
  created_at: string;
}

export const useSupportTickets = () => {
  const { user } = useAuth();
  return useQuery<SupportTicket[], Error>({
    queryKey: ['supportTickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user,
  });
};

export const useTicketMessages = (ticketId?: string) => {
  return useQuery<SupportMessage[], Error>({
    queryKey: ['ticketMessages', ticketId],
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

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ subject, category, message }: { subject: string; category: string; message: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Criar Ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({ user_id: user.id, subject, category, status: 'open' })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Criar Primeira Mensagem
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticket.id, sender_role: 'user', message });

      if (msgError) throw msgError;

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    },
  });
};

export const useSendReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { data, error } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticketId, sender_role: 'user', message })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticketMessages', variables.ticketId] });
    },
  });
};