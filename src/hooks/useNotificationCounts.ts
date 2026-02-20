import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationCounts {
  unreadMessages: number;
  pendingFriendRequests: number;
}

export const useNotificationCounts = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    pendingFriendRequests: 0,
  });

  const fetchCounts = async () => {
    if (!user) return;

    // Fetch unread messages: messages in user's conversations where sender != user and read_at is null
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (participations && participations.length > 0) {
      const conversationIds = participations.map(p => p.conversation_id);
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      setCounts(prev => ({ ...prev, unreadMessages: unreadCount ?? 0 }));
    } else {
      setCounts(prev => ({ ...prev, unreadMessages: 0 }));
    }

    // Fetch pending friend requests (where current user is the recipient)
    const { count: friendCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    setCounts(prev => ({ ...prev, pendingFriendRequests: friendCount ?? 0 }));
  };

  useEffect(() => {
    fetchCounts();

    if (!user) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('notification-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => fetchCounts()
      )
      .subscribe();

    // Subscribe to friendship changes
    const friendsChannel = supabase
      .channel('notification-friends')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(friendsChannel);
    };
  }, [user]);

  return { ...counts, refetch: fetchCounts };
};
