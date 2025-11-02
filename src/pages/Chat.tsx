import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useConversationDetails } from "@/hooks/useConversationDetails";
import type { MessageWithProfile } from "@/types/api";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { conversation, participants, messages, loading, sendMessage: sendMsg } = useConversationDetails(
    conversationId,
    user?.id
  );

  // Polling fallback for messages (hook handles realtime)
  useEffect(() => {
    if (!conversationId || !user) return;

    const polling = setInterval(() => {
      // Hook will handle the refresh
    }, 5000);

    return () => {
      clearInterval(polling);
    };
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const getConversationTitle = () => {
    if (!conversation) return "";
    
    if (conversation.is_group) {
      return conversation.name || 'Group Chat';
    }
    
    const otherParticipant = participants.find(p => p.user_id !== user?.id);
    return otherParticipant?.display_name || 
           otherParticipant?.username || 
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

  const shouldShowDateDivider = (currentMsg: MessageWithProfile, prevMsg: MessageWithProfile | undefined) => {
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
              {participants.find(p => p.user_id !== user?.id)?.avatar_url && (
                <AvatarImage src={participants.find(p => p.user_id !== user?.id)?.avatar_url || undefined} />
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
