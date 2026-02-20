import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import { messageService } from "@/services/messageService";
import { supabase } from "@/integrations/supabase/client";
import type { MessageWithProfile } from "@/types/api";

const QUICK_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

interface ReactionData {
  emoji: string;
  user_id: string;
}

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reactions, setReactions] = useState<Record<string, ReactionData[]>>({});

  const { conversation, participants, messages, loading, sendMessage: sendMsg } = useConversationDetails(
    conversationId,
    user?.id
  );

  // Fetch reactions when messages change
  const fetchReactions = useCallback(async () => {
    if (messages.length === 0) return;
    const messageIds = messages.map(m => m.id);
    const data = await messageService.getReactions(messageIds);
    setReactions(data);
  }, [messages]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // Subscribe to reaction changes
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`reactions-${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        () => fetchReactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchReactions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu when tapping outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeMessageId) setActiveMessageId(null);
    };
    if (activeMessageId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMessageId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const success = await sendMsg(newMessage);
    if (success) {
      setNewMessage("");
    } else {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleLongPressStart = (messageId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setActiveMessageId(messageId);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setActiveMessageId(null);
    const result = await messageService.deleteMessage(messageId);
    if (!result.success) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    setActiveMessageId(null);
    await messageService.toggleReaction(messageId, emoji);
  };

  const getConversationTitle = () => {
    if (!conversation) return "";
    if (conversation.is_group) return conversation.name || 'Group Chat';
    const otherParticipant = participants.find(p => p.user_id !== user?.id);
    return otherParticipant?.display_name || otherParticipant?.username || 'Chat';
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) return 'Today';
    if (messageDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const shouldShowDateDivider = (currentMsg: MessageWithProfile, prevMsg: MessageWithProfile | undefined) => {
    if (!prevMsg) return true;
    return new Date(currentMsg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
  };

  // Group reactions by emoji with count
  const getGroupedReactions = (messageId: string) => {
    const msgReactions = reactions[messageId] || [];
    const grouped: Record<string, { count: number; hasOwn: boolean }> = {};
    for (const r of msgReactions) {
      if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, hasOwn: false };
      grouped[r.emoji].count++;
      if (r.user_id === user?.id) grouped[r.emoji].hasOwn = true;
    }
    return grouped;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-safe-top bg-card" />
      {/* Header */}
      <header className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {!conversation?.is_group && participants.length > 0 && (
            <Avatar className="w-10 h-10">
              {participants.find(p => p.user_id !== user?.id)?.avatar_url && (
                <AvatarImage src={participants.find(p => p.user_id !== user?.id)?.avatar_url || undefined} />
              )}
              <AvatarFallback>{getConversationTitle()[0]}</AvatarFallback>
            </Avatar>
          )}
          <div>
            <h1 className="font-semibold">{getConversationTitle()}</h1>
            {conversation?.is_group && (
              <p className="text-xs text-muted-foreground">{participants.length} members</p>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message, index) => {
              const showDateDivider = shouldShowDateDivider(message, messages[index - 1]);
              const isOwn = message.sender_id === user?.id;
              const showAvatar = !isOwn && conversation?.is_group;
              const isActive = activeMessageId === message.id;
              const groupedReactions = getGroupedReactions(message.id);

              return (
                <div key={message.id}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                        {formatMessageDate(message.created_at)}
                      </div>
                    </div>
                  )}

                  <div className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {showAvatar && (
                      <Avatar className="w-8 h-8">
                        {message.profiles?.avatar_url && <AvatarImage src={message.profiles.avatar_url} />}
                        <AvatarFallback>
                          {message.profiles?.display_name?.[0] || message.profiles?.username?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`max-w-[70%] relative ${showAvatar ? '' : !isOwn ? 'ml-10' : ''}`}>
                      {!isOwn && conversation?.is_group && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.profiles?.display_name || message.profiles?.username}
                        </p>
                      )}

                      {/* iOS-style reaction bar - shown on long press */}
                      {isActive && (
                        <div
                          className={`absolute ${isOwn ? 'right-0' : 'left-0'} bottom-full mb-2 z-50 animate-in fade-in zoom-in-95 duration-150`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="bg-card border rounded-full shadow-lg px-2 py-1.5 flex items-center gap-1">
                            {QUICK_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="text-xl hover:scale-125 transition-transform p-1 rounded-full hover:bg-muted"
                              >
                                {emoji}
                              </button>
                            ))}
                            {isOwn && (
                              <>
                                <div className="w-px h-6 bg-border mx-1" />
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <div
                        onTouchStart={() => handleLongPressStart(message.id)}
                        onTouchEnd={handleLongPressEnd}
                        onTouchCancel={handleLongPressEnd}
                        onMouseDown={() => handleLongPressStart(message.id)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setActiveMessageId(message.id);
                        }}
                        className={`rounded-2xl px-4 py-2 select-none cursor-pointer transition-all ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${isActive ? 'scale-[1.02] ring-2 ring-primary/30' : ''}`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>

                      {/* Reaction pills */}
                      {Object.keys(groupedReactions).length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(groupedReactions).map(([emoji, { count, hasOwn }]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message.id, emoji)}
                              className={`inline-flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5 border transition-colors ${
                                hasOwn
                                  ? 'bg-primary/10 border-primary/30 text-primary'
                                  : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 1 && <span className="font-medium">{count}</span>}
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-1">
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
