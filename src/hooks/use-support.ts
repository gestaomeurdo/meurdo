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

// 1. Hook para buscar todos os chats/tickets do usuário (usado na lista da aba Assinatura)
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

// 2. Hook para buscar mensagens de um chat específico
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

// 3. Hook para enviar resposta (usado no componente de chat)
export const useSendReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string, message: string }) => {
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticketId, sender_role: 'user', message });
      if (msgError) throw msgError;

      // Atualiza status para 'open' para notificar o admin
      await supabase.from('support_tickets').update({ status: 'open' }).eq('id', ticketId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    }
  });
};

// 4. Hook unificado para a página de suporte (Estilo Zap)
export const useUserChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const chatQuery = useQuery({
    queryKey: ['userChat', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as SupportTicket | null;
    },
    enabled: !!user,
  });

  const messagesQuery = useQuery({
    queryKey: ['chatMessages', chatQuery.data?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', chatQuery.data!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as SupportMessage[];
    },
    enabled: !!chatQuery.data?.id,
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      let chatId = chatQuery.data?.id;

      if (!chatId) {
        const { data: newChat, error: chatError } = await supabase
          .from('support_tickets')
          .insert({ user_id: user!.id, subject: 'Atendimento Direto', category: 'Chat' })
          .select()
          .single();
        if (chatError) throw chatError;
        chatId = newChat.id;
      }

      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({ ticket_id: chatId, sender_role: 'user', message });
      if (msgError) throw msgError;

      await supabase.from('support_tickets').update({ status: 'open' }).eq('id', chatId);
      return chatId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userChat'] });
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    }
  });

  return { 
    chat: chatQuery.data, 
    messages: messagesQuery.data || [], 
    isLoading: chatQuery.isLoading || messagesQuery.isLoading,
    sendMessage 
  };
};