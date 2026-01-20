import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-provider";
import { showSuccess } from "@/utils/toast";

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('sender_role', 'support')
      .is('read_at', null);

    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('support_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('sender_role', 'support')
      .is('read_at', null);

    if (!error) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();

    // Inscrição em tempo real para novas mensagens do suporte
    const channel = supabase
      .channel('unread_messages_count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Só incrementa se a mensagem vier do suporte
          if (payload.new.sender_role === 'support') {
            setUnreadCount((prev) => prev + 1);
            showSuccess("Nova mensagem do Suporte Técnico!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { unreadCount, markAllAsRead };
};