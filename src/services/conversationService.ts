import { supabase } from '@/integrations/supabase/client';
import type { Conversation, Message, Profile } from '@/types';
import type { MessageWithProfile } from '@/types/api';

interface ConversationWithDetails extends Conversation {
  lastMessage?: Message;
  participants: Profile[];
}

export const conversationService = {
  /**
   * Get a conversation by ID
   */
  async getConversationById(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return null;
    }

    return data;
  },

  /**
   * Get participants for a conversation
   */
  async getConversationParticipants(conversationId: string): Promise<Profile[]> {
    const { data: parts, error: partsError } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    if (partsError) {
      console.error('Error fetching participants:', partsError);
      return [];
    }

    if (!parts || parts.length === 0) return [];

    const userIds: string[] = parts.map(p => p.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, id, bio, created_at, updated_at')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return [];
    }

    return profiles || [];
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data: msgs, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return msgs || [];
  },

  /**
   * Get messages with sender profiles
   */
  async getMessagesWithProfiles(conversationId: string): Promise<MessageWithProfile[]> {
    const messages = await this.getMessages(conversationId);

    if (messages.length === 0) return [];

    const senderIds = Array.from(new Set(messages.map(m => m.sender_id))) as string[];
    if (senderIds.length === 0) return messages;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url')
      .in('user_id', senderIds);

    const messagesWithProfiles = messages.map(msg => ({
      ...msg,
      profiles: profiles?.find(p => p.user_id === msg.sender_id)
    }));

    return messagesWithProfiles;
  },

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  /**
   * Get last message for a conversation
   */
  async getLastMessage(conversationId: string): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .select('content, created_at, sender_id, id, conversation_id, delivered_at, read_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching last message:', error);
      return null;
    }

    return data;
  },

  /**
   * Get conversation with details (participants and last message)
   */
  async getConversationWithDetails(conversationId: string, currentUserId: string): Promise<ConversationWithDetails | null> {
    const conversation = await this.getConversationById(conversationId);
    if (!conversation) return null;

    const [participants, lastMessage] = await Promise.all([
      this.getConversationParticipants(conversationId),
      this.getLastMessage(conversationId)
    ]);

    return {
      ...conversation,
      lastMessage: lastMessage || undefined,
      participants
    };
  },

  /**
   * Get all conversations with details for a user
   */
  async getConversationsWithDetails(userId: string): Promise<ConversationWithDetails[]> {
    // First get all conversations the user is part of
    const { data: userConversations, error } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (error || !userConversations) {
      console.error('Error fetching user conversations:', error);
      return [];
    }

    const conversationIds = userConversations.map(c => c.conversation_id);
    if (conversationIds.length === 0) return [];

    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds);

    if (convError || !conversations) {
      console.error('Error fetching conversations:', convError);
      return [];
    }

    // Fetch details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const [lastMessage, allParticipants] = await Promise.all([
          this.getLastMessage(conversation.id),
          this.getConversationParticipants(conversation.id)
        ]);

        // Filter out current user from participants
        const participants = allParticipants.filter(p => p.user_id !== userId);

        return {
          ...conversation,
          lastMessage: lastMessage || undefined,
          participants
        };
      })
    );

    // Sort by last message time
    conversationsWithDetails.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.created_at;
      const bTime = b.lastMessage?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return conversationsWithDetails;
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.rpc('mark_messages_as_read', {
      conversation_uuid: conversationId,
      reader_user_id: userId
    });

    if (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }
};
