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
  user_id?: string;
  ticket_id?: string;
  sender_role: SenderRole;
  message: string;
  created_at: string;
}

// Hook unificado para a página de suporte (Estilo Zap)
export const useUserChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['chatMessages', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as SupportMessage[];
    },
    enabled: !!user,
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error("Não autenticado");

      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({ 
            user_id: user.id, 
            sender_role: 'user', 
            message 
        });
      if (msgError) throw msgError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', user?.id] });
    }
  });

  return { 
    messages: messagesQuery.data || [], 
    isLoading: messagesQuery.isLoading,
    sendMessage 
  };
};

// Mantendo suporte aos tickets antigos por compatibilidade se necessário
export const useSupportTickets = () => {
  const { user } = useAuth();
  return useQuery<SupportTicket[], Error>({
    queryKey: ['supportTickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user,
  });
};

export const useTicketMessages = (ticketId?: string) => {
    return useQuery<SupportMessage[], Error>({
      queryKey: ['chatMessages', ticketId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('support_messages')
          .select('*')
          .eq('ticket_id', ticketId!)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return data as SupportMessage[];
      },
      enabled: !!ticketId,
    });
};