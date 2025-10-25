import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const FriendRecommendations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_gym_based_friend_recommendations', {
        current_user_id: user?.id,
        limit_count: 20
      });

      if (error) throw error;
      setRecommendations(data || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load friend recommendations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      setSendingRequests(prev => new Set(prev).add(friendId));

      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user?.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully"
      });

      // Remove from recommendations
      setRecommendations(prev => prev.filter(rec => rec.user_id !== friendId));
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive"
      });
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Friend Recommendations</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              People at Your Gyms
            </CardTitle>
            <CardDescription>
              Connect with people who work out at the same gyms as you
            </CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading recommendations...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
              <p className="text-muted-foreground mb-4">
                Visit gyms and log workouts to find people who work out at the same places
              </p>
              <Button onClick={() => navigate('/gyms-near-you')}>
                Find Gyms Near You
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {recommendations.map((recommendation) => (
              <Card key={recommendation.user_id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14">
                      {recommendation.avatar_url && (
                        <AvatarImage src={recommendation.avatar_url} />
                      )}
                      <AvatarFallback>
                        {recommendation.display_name?.[0] || recommendation.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {recommendation.display_name || recommendation.username}
                          </h3>
                          {recommendation.username && recommendation.display_name !== recommendation.username && (
                            <p className="text-sm text-muted-foreground">
                              @{recommendation.username}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {recommendation.shared_gyms_count} shared {recommendation.shared_gyms_count === 1 ? 'gym' : 'gyms'}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => sendFriendRequest(recommendation.user_id)}
                          disabled={sendingRequests.has(recommendation.user_id)}
                          size="sm"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {sendingRequests.has(recommendation.user_id) ? 'Sending...' : 'Add Friend'}
                        </Button>
                      </div>
                      
                      {recommendation.common_gym_names && recommendation.common_gym_names.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {recommendation.common_gym_names.slice(0, 3).map((gym: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {gym}
                            </Badge>
                          ))}
                          {recommendation.common_gym_names.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{recommendation.common_gym_names.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FriendRecommendations;
