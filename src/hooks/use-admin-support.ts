import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupportMessage } from "./use-support";

export interface AdminUserConversation {
  id: string; // User ID
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  plan_type: string | null;
  last_message_at: string | null;
  has_messages: boolean;
}

export const useAdminInbox = () => {
  return useQuery<AdminUserConversation[], Error>({
    queryKey: ['adminInbox'],
    queryFn: async () => {
      // 1. Busca todos os perfis
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, plan_type')
        .order('first_name', { ascending: true });

      if (profError) throw profError;

      // 2. Busca a data da última mensagem de cada usuário para ordenar
      const { data: messages, error: msgError } = await supabase
        .from('support_messages')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // 3. Mapeia e cruza os dados
      const inbox = profiles.map(p => {
        const userMessages = messages.filter(m => m.user_id === p.id);
        const lastMsg = userMessages[0];
        
        return {
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: 'N/A',
          plan_type: p.plan_type,
          last_message_at: lastMsg?.created_at || null,
          has_messages: userMessages.length > 0
        };
      });

      // 4. Ordena: quem tem mensagem primeiro, depois por data, depois alfabético
      return inbox.sort((a, b) => {
        if (a.has_messages && !b.has_messages) return -1;
        if (!a.has_messages && b.has_messages) return 1;
        if (a.last_message_at && b.last_message_at) {
            return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        }
        return 0;
      });
    },
    staleTime: 1000 * 30,
  });
};

export const useAdminChatMessages = (userId?: string) => {
  return useQuery<SupportMessage[], Error>({
    queryKey: ['adminChatMessages', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as SupportMessage[];
    },
    enabled: !!userId,
  });
};

export const useAdminReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const { error } = await supabase
        .from('support_messages')
        .insert({ 
            user_id: userId, 
            sender_role: 'support', 
            message 
        });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminInbox'] });
      queryClient.invalidateQueries({ queryKey: ['adminChatMessages', variables.userId] });
    },
  });
};

export const useAdminUpdateStatus = () => {
    return useMutation({
        mutationFn: async ({ ticketId, status }: { ticketId: string, status: string }) => {
            if (!ticketId) return;
            await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
        }
    });
};

export const useStartChatWithUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => userId,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInbox'] });
    }
  });
};