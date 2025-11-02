import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useFriends } from "@/hooks/useFriends";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ROUTES } from "@/constants/routes";
import { conversationService } from "@/services/conversationService";
import type { Profile } from "@/types";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { conversations, loading, createConversation, refetch } = useConversations();
  const { friends } = useFriends();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [conversationsWithData, setConversationsWithData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch conversation details using service
  useEffect(() => {
    if (!loading && conversations.length > 0 && user) {
      fetchConversationDetails();
    } else {
      setLoadingData(loading);
    }
  }, [conversations, loading, user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const fetchConversationDetails = async () => {
    if (!user) return;
    
    setLoadingData(true);
    const conversationsWithDetails = await conversationService.getConversationsWithDetails(user.id);
    setConversationsWithData(conversationsWithDetails);
    setLoadingData(false);
  };

  const handleCreateConversation = async () => {
    if (selectedFriends.length === 0) return;

    const isGroup = selectedFriends.length > 1;
    const conversationId = await createConversation(
      selectedFriends,
      isGroup,
      isGroup ? groupName || 'Group Chat' : undefined
    );

    if (conversationId) {
      setShowNewChat(false);
      setSelectedFriends([]);
      setGroupName("");
      navigate(ROUTES.CHAT(conversationId));
    }
  };

  const getConversationName = (convo: any) => {
    if (convo.is_group) {
      return convo.name || 'Group Chat';
    }
    return convo.participants[0]?.display_name || 
           convo.participants[0]?.username || 
           'Unknown';
  };

  const getConversationAvatar = (convo: any) => {
    if (!convo.is_group && convo.participants[0]) {
      return convo.participants[0].avatar_url;
    }
    return null;
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversationsWithData.filter(convo =>
    getConversationName(convo).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Messages" showBackButton />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <PageHeader title="Messages" showBackButton onBack={() => navigate(ROUTES.HOME)} />
          
          <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedFriends.length > 1 && (
                  <Input
                    placeholder="Group name (optional)"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                )}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedFriends.includes(friend.user_id)}
                        onCheckedChange={(checked) => {
                          setSelectedFriends(prev =>
                            checked
                              ? [...prev, friend.user_id]
                              : prev.filter(id => id !== friend.user_id)
                          );
                        }}
                      />
                      <Avatar className="w-10 h-10">
                        {friend.avatar_url && <AvatarImage src={friend.avatar_url} />}
                        <AvatarFallback>{friend.display_name?.[0] || friend.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <span>{friend.display_name || friend.username}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleCreateConversation}
                  disabled={selectedFriends.length === 0}
                  className="w-full"
                >
                  Create Chat
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <Card className="p-12">
            <EmptyState
              icon={MessageCircle}
              title="No conversations yet"
              description="Start chatting with your gym friends!"
            />
            <div className="text-center mt-4">
              <Button onClick={() => setShowNewChat(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((convo) => (
              <Card
                key={convo.id}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(ROUTES.CHAT(convo.id))}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    {getConversationAvatar(convo) && <AvatarImage src={getConversationAvatar(convo)} />}
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {convo.is_group ? '👥' : getConversationName(convo)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h3 className="font-semibold truncate">{getConversationName(convo)}</h3>
                      {convo.lastMessage && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(convo.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {convo.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
