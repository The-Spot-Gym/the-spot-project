import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversation, setConversation] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId && user) {
      fetchConversation();
      fetchMessages();

      // Set up real-time subscription
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
          (payload) => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setConversation(data);

      // Fetch participants
      const { data: parts, error: partsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId);

      if (partsError) throw partsError;

      // Fetch profiles for participants
      if (parts && parts.length > 0) {
        const userIds = parts.map(p => p.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combine participants with their profiles
        const participantsWithProfiles = parts.map(p => ({
          user_id: p.user_id,
          profiles: profiles?.find(profile => profile.user_id === p.user_id)
        }));
        
        setParticipants(participantsWithProfiles);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for message senders
      if (msgs && msgs.length > 0) {
        const senderIds = [...new Set(msgs.map(m => m.sender_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', senderIds);

        // Attach profiles to messages
        const messagesWithProfiles = msgs.map(msg => ({
          ...msg,
          profiles: profiles?.find(p => p.user_id === msg.sender_id)
        }));
        
        setMessages(messagesWithProfiles);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const getConversationTitle = () => {
    if (!conversation) return "";
    
    if (conversation.is_group) {
      return conversation.name || 'Group Chat';
    }
    
    const otherParticipant = participants.find(p => p.user_id !== user?.id);
    return otherParticipant?.profiles?.display_name || 
           otherParticipant?.profiles?.username || 
           'Chat';
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const shouldShowDateDivider = (currentMsg: any, prevMsg: any) => {
    if (!prevMsg) return true;
    
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    
    return currentDate !== prevDate;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {!conversation?.is_group && participants.length > 0 && (
            <Avatar className="w-10 h-10">
              {participants.find(p => p.user_id !== user?.id)?.profiles?.avatar_url && (
                <AvatarImage src={participants.find(p => p.user_id !== user?.id)?.profiles?.avatar_url} />
              )}
              <AvatarFallback>
                {getConversationTitle()[0]}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h1 className="font-semibold">{getConversationTitle()}</h1>
            {conversation?.is_group && (
              <p className="text-xs text-muted-foreground">
                {participants.length} members
              </p>
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
                    
                    <div className={`max-w-[70%] ${showAvatar ? '' : 'ml-10'}`}>
                      {!isOwn && conversation?.is_group && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.profiles?.display_name || message.profiles?.username}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
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
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-2">
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
