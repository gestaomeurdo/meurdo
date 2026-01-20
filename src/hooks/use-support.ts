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

export const useUserChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Busca o chat (ticket) principal do usuário
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

  // 2. Busca mensagens se o chat existir
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

  // 3. Mutation de envio (Cria chat se não existir)
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      let chatId = chatQuery.data?.id;

      // Se não tem chat, cria um invisível
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

      // Atualiza status para Robson saber que tem msg nova
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