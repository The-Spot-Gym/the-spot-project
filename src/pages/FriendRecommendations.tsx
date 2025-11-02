import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Users, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ROUTES } from "@/constants/routes";

const FriendRecommendations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendRequest } = useFriends();
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
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    setSendingRequests(prev => new Set(prev).add(friendId));
    
    const success = await sendRequest(friendId);
    
    if (success) {
      setRecommendations(prev => prev.filter(rec => rec.user_id !== friendId));
    }
    
    setSendingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(friendId);
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Friend Recommendations" showBackButton />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Friend Recommendations" showBackButton onBack={() => navigate(ROUTES.HOME)} />

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

        {recommendations.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={Users}
              title="No recommendations yet"
              description="Visit gyms and log workouts to find people who work out at the same places"
            />
            <div className="text-center mt-4">
              <Button onClick={() => navigate(ROUTES.GYMS_NEAR_YOU)}>
                Find Gyms Near You
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {recommendations.map((recommendation) => (
              <Card key={recommendation.user_id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <Avatar className="w-14 h-14 flex-shrink-0">
                      {recommendation.avatar_url && (
                        <AvatarImage src={recommendation.avatar_url} />
                      )}
                      <AvatarFallback>
                        {recommendation.display_name?.[0] || recommendation.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg truncate">
                            {recommendation.display_name || recommendation.username}
                          </h3>
                          {recommendation.username && recommendation.display_name !== recommendation.username && (
                            <p className="text-sm text-muted-foreground truncate">
                              @{recommendation.username}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">
                              {recommendation.shared_gyms_count} shared {recommendation.shared_gyms_count === 1 ? 'gym' : 'gyms'}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleSendFriendRequest(recommendation.user_id)}
                          disabled={sendingRequests.has(recommendation.user_id)}
                          size="sm"
                          className="w-full sm:w-auto flex-shrink-0"
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
