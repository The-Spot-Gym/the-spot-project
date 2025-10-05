import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchFriends();
      
      // Set up real-time subscription for new messages
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          () => fetchConversations()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all conversations the user is part of
      const { data: convos, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations:conversation_id (
            id,
            name,
            is_group,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // For each conversation, get the last message and other participants
      const conversationsWithDetails = await Promise.all(
        (convos || []).map(async (convo) => {
          const conversation = convo.conversations;
          
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get other participants
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              user_id,
              profiles:user_id (
                display_name,
                username,
                avatar_url
              )
            `)
            .eq('conversation_id', conversation.id)
            .neq('user_id', user.id);

          return {
            ...conversation,
            lastMessage,
            participants: participants || []
          };
        })
      );

      // Sort by last message time
      conversationsWithDetails.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // First get friendships
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendError) throw friendError;

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        return;
      }

      // Then fetch profiles for those friend IDs
      const friendIds = friendships.map(f => f.friend_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', friendIds);

      if (profileError) throw profileError;

      setFriends(profiles || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const createConversation = async () => {
    if (selectedFriends.length === 0) return;

    try {
      const isGroup = selectedFriends.length > 1;
      
      // Create conversation
      const { data: conversation, error: convoError } = await supabase
        .from('conversations')
        .insert({
          name: isGroup ? groupName || 'Group Chat' : null,
          is_group: isGroup,
          created_by: user?.id
        })
        .select()
        .single();

      if (convoError) throw convoError;

      // Add participants (including current user)
      const participants = [user?.id, ...selectedFriends].map(userId => ({
        conversation_id: conversation.id,
        user_id: userId
      }));

      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (partError) throw partError;

      toast({
        title: "Chat created!",
        description: isGroup ? "Group chat created successfully" : "Direct message started"
      });

      setShowNewChat(false);
      setSelectedFriends([]);
      setGroupName("");
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create chat",
        variant: "destructive"
      });
    }
  };

  const getConversationName = (convo: any) => {
    if (convo.is_group) {
      return convo.name || 'Group Chat';
    }
    return convo.participants[0]?.profiles?.display_name || 
           convo.participants[0]?.profiles?.username || 
           'Unknown';
  };

  const getConversationAvatar = (convo: any) => {
    if (!convo.is_group && convo.participants[0]) {
      return convo.participants[0].profiles?.avatar_url;
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

  const filteredConversations = conversations.filter(convo =>
    getConversationName(convo).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-bold text-xl">Messages</h1>
          </div>
          
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
                    <div key={friend.user_id} className="flex items-center gap-3">
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
                  onClick={createConversation}
                  disabled={selectedFriends.length === 0}
                  className="w-full"
                >
                  Create Chat
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

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
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No conversations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start chatting with your gym friends!
            </p>
            <Button onClick={() => setShowNewChat(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Start New Chat
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((convo) => (
              <Card
                key={convo.id}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/chat/${convo.id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    {getConversationAvatar(convo) && <AvatarImage src={getConversationAvatar(convo)} />}
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {convo.is_group ? '👥' : getConversationName(convo)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{getConversationName(convo)}</h3>
                      {convo.lastMessage && (
                        <span className="text-xs text-muted-foreground">
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
