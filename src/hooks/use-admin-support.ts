import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupportTicket, SupportMessage } from "./use-support";

export interface AdminChatRoom extends SupportTicket {
  user_name: string;
  user_email: string;
  plan_type: string;
  last_message?: string;
  last_message_at?: string;
}

export const useAdminInbox = () => {
  return useQuery<AdminChatRoom[], Error>({
    queryKey: ['adminInbox'],
    queryFn: async () => {
      // Busca tickets (salas de chat) com dados do perfil
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, profiles(first_name, last_name, email, plan_type)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((t: any) => ({
        ...t,
        user_name: `${t.profiles?.first_name || ''} ${t.profiles?.last_name || ''}`.trim() || 'Usuário Sem Nome',
        user_email: t.profiles?.email || 'N/A',
        plan_type: t.profiles?.plan_type || 'FREE'
      })) as AdminChatRoom[];
    },
    staleTime: 1000 * 30,
  });
};

export const useAdminChatMessages = (ticketId?: string) => {
    return useQuery<SupportMessage[], Error>({
      queryKey: ['adminChatMessages', ticketId],
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

      // Marca como resolvido/respondido no ticket
      await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', ticketId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminInbox'] });
      queryClient.invalidateQueries({ queryKey: ['adminChatMessages', variables.ticketId] });
    },
  });
};

// Hook especial para você INICIAR conversa com qualquer um
export const useStartChatWithUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: string) => {
            // Verifica se já existe um ticket para esse user
            const { data: existing } = await supabase
                .from('support_tickets')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();
            
            if (existing) return existing.id;

            // Se não, cria
            const { data: created, error } = await supabase
                .from('support_tickets')
                .insert({ user_id: userId, subject: 'Prospecção Robson', category: 'Chat' })
                .select()
                .single();
            
            if (error) throw error;
            return created.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInbox'] });
        }
    });
};