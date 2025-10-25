import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const FriendRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriendRequests();
    }
  }, [user]);

  const fetchFriendRequests = async () => {
    if (!user) return;

    try {
      // Fetch received friend requests
      const { data: received, error: receivedError } = await supabase
        .from('friendships')
        .select('id, user_id, status, created_at')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      // Fetch sent friend requests
      const { data: sent, error: sentError } = await supabase
        .from('friendships')
        .select('id, friend_id, status, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Fetch profiles for received requests
      if (received && received.length > 0) {
        const userIds = received.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        const receivedWithProfiles = received.map(r => ({
          ...r,
          profiles: profiles?.find(p => p.user_id === r.user_id)
        }));
        setPendingRequests(receivedWithProfiles);
      } else {
        setPendingRequests([]);
      }

      // Fetch profiles for sent requests
      if (sent && sent.length > 0) {
        const friendIds = sent.map(r => r.friend_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', friendIds);

        const sentWithProfiles = sent.map(r => ({
          ...r,
          profiles: profiles?.find(p => p.user_id === r.friend_id)
        }));
        setSentRequests(sentWithProfiles);
      } else {
        setSentRequests([]);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      toast({
        title: "Error",
        description: "Failed to load friend requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, friendUserId: string) => {
    try {
      // Update friendship status
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      // Create reverse friendship for bidirectional relationship
      await supabase
        .from('friendships')
        .insert({
          user_id: user?.id,
          friend_id: friendUserId,
          status: 'accepted'
        });

      toast({
        title: "Friend request accepted!",
        description: "You can now message this friend"
      });

      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Friend request declined"
      });

      fetchFriendRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to decline friend request",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-xl">Friend Requests</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Received Requests */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 className="font-semibold mb-4">Received Requests</h2>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              {request.profiles?.avatar_url && <AvatarImage src={request.profiles.avatar_url} />}
                              <AvatarFallback>
                                {request.profiles?.display_name?.[0] || request.profiles?.username?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">
                                {request.profiles?.display_name || request.profiles?.username}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRequest(request.id, request.user_id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <div>
                <h2 className="font-semibold mb-4">Sent Requests</h2>
                <div className="space-y-2">
                  {sentRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              {request.profiles?.avatar_url && <AvatarImage src={request.profiles.avatar_url} />}
                              <AvatarFallback>
                                {request.profiles?.display_name?.[0] || request.profiles?.username?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">
                                {request.profiles?.display_name || request.profiles?.username}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Sent {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <Card className="p-12 text-center">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No friend requests</h3>
                <p className="text-sm text-muted-foreground">
                  Start connecting with people at your gym to send friend requests
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;
