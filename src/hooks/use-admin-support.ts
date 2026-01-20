import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupportMessage } from "./use-support";

export interface AdminUserConversation {
  id: string; // User ID
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  plan_type: string | null;
  ticket_id?: string | null;
  last_message_at: string | null;
  status?: string;
}

export const useAdminInbox = () => {
  return useQuery<AdminUserConversation[], Error>({
    queryKey: ['adminInbox'],
    queryFn: async () => {
      // 1. Busca todos os usuários que enviaram mensagens
      const { data: messages, error: msgError } = await supabase
        .from('support_messages')
        .select('user_id, created_at')
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // Pegar IDs únicos dos usuários
      const userIds = Array.from(new Set(messages.map(m => m.user_id).filter(Boolean)));

      if (userIds.length === 0) return [];

      // 2. Buscar perfis desses usuários
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, plan_type')
        .in('id', userIds);

      if (profError) throw profError;

      // 3. Montar a lista de conversas
      return userIds.map(uid => {
        const profile = profiles.find(p => p.id === uid);
        const lastMsg = messages.find(m => m.user_id === uid);
        return {
          id: uid,
          first_name: profile?.first_name || 'Usuário',
          last_name: profile?.last_name || 'Desconhecido',
          email: 'N/A', // O e-mail não está no profile público por padrão
          plan_type: profile?.plan_type,
          last_message_at: lastMsg?.created_at || null,
        } as AdminUserConversation;
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
    // Mantido para compatibilidade, mas agora o chat é contínuo
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
    mutationFn: async (userId: string) => {
      return userId; // No modelo direto, apenas retornamos o ID do usuário
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInbox'] });
    }
  });
};