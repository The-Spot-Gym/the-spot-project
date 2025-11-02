import { useState, useEffect } from 'react';
import { messageService } from '@/services/messageService';
import type { Conversation } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = async () => {
    setLoading(true);
    const data = await messageService.getConversations();
    setConversations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const createConversation = async (
    participantIds: string[],
    isGroup: boolean = false,
    name?: string
  ) => {
    const result = await messageService.createConversation(participantIds, isGroup, name);
    
    if (result.success) {
      await fetchConversations();
      return result.conversationId;
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create conversation",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    conversations,
    loading,
    createConversation,
    refetch: fetchConversations,
  };
};
