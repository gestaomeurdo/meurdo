import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SupportMessage } from "./use-support";

export interface AdminUserConversation {
  id: string; // User ID
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  plan_type: string | null;
  ticket_id: string | null;
  last_message_at: string | null;
}

export const useAdminInbox = () => {
  return useQuery<AdminUserConversation[], Error>({
    queryKey: ['adminInbox'],
    queryFn: async () => {
      // 1. Busca todos os usuários com tickets (salas de chat)
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, profiles(first_name, last_name, email, plan_type)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((t: any) => ({
        id: t.user_id,
        first_name: t.profiles?.first_name,
        last_name: t.profiles?.last_name,
        email: t.profiles?.email,
        plan_type: t.profiles?.plan_type,
        ticket_id: t.id,
        last_message_at: t.created_at,
        status: t.status
      })) as any[];
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
        .eq('ticket_id', ticketId!)
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
      const { error } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticketId, sender_role: 'support', message });
      if (error) throw error;

      // Marca o ticket como resolvido quando o admin responde
      await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', ticketId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminInbox'] });
      queryClient.invalidateQueries({ queryKey: ['adminChatMessages', variables.ticketId] });
    },
  });
};

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

      // Se não, cria um chat invisível para começar a falar
      const { data: created, error } = await supabase
        .from('support_tickets')
        .insert({ user_id: userId, subject: 'Atendimento Direto Robson', category: 'Chat' })
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