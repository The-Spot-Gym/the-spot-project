import { supabase } from "@/integrations/supabase/client";
import type { Conversation, Message, ConversationParticipant, Profile } from "@/types";

export const messageService = {
  /**
   * Get conversations for current user
   */
  async getConversations(): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
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
   * Get conversation participants
   */
  async getParticipants(conversationId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error fetching participants:', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Fetch profiles separately
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', data.map(p => p.user_id));

    if (profileError) {
      console.error('Error fetching participant profiles:', profileError);
      return [];
    }

    return profiles || [];
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Send a message
   */
  async sendMessage(conversationId: string, content: string): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
      });

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { success: true };
  },

  /**
   * Create a new conversation
   */
  async createConversation(
    participantIds: string[],
    isGroup: boolean = false,
    name?: string
  ): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        created_by: user.id,
        is_group: isGroup,
        name: name || null,
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return { success: false, error: convError.message };
    }

    // Add participants (including creator)
    const allParticipants = [user.id, ...participantIds];
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert(
        allParticipants.map(userId => ({
          conversation_id: conversation.id,
          user_id: userId,
        }))
      );

    if (participantError) {
      console.error('Error adding participants:', participantError);
      return { success: false, error: participantError.message };
    }

    return { success: true, conversationId: conversation.id };
  },
};
