import { useState, useEffect } from 'react';
import { conversationService } from '@/services/conversationService';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation, Profile } from '@/types';
import type { MessageWithProfile } from '@/types/api';

export const useConversationDetails = (conversationId: string | undefined, userId: string | undefined) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (conversationId && userId) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [conversationId, userId]);

  const fetchData = async () => {
    if (!conversationId || !userId) return;

    setLoading(true);
    try {
      const [convData, participantData, messageData] = await Promise.all([
        conversationService.getConversationById(conversationId),
        conversationService.getConversationParticipants(conversationId),
        conversationService.getMessagesWithProfiles(conversationId)
      ]);

      setConversation(convData);
      setParticipants(participantData);
      setMessages(messageData);
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Fetch the sender's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url')
            .eq('user_id', newMsg.sender_id)
            .single();

          // Add the new message with profile to state (avoid duplicates)
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, profiles: profile }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (content: string) => {
    if (!conversationId || !userId || !content.trim()) return false;

    const result = await conversationService.sendMessage(conversationId, userId, content);
    return result.success;
  };

  const refreshMessages = async () => {
    if (!conversationId) return;
    const messageData = await conversationService.getMessagesWithProfiles(conversationId);
    setMessages(messageData);
  };

  return {
    conversation,
    participants,
    messages,
    loading,
    sendMessage,
    refreshMessages,
  };
};
