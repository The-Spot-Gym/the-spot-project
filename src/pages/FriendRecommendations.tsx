import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Users, MapPin, Loader2, UsersRound, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFriends } from "@/hooks/useFriends";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ROUTES } from "@/constants/routes";

interface FriendRecommendation {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  shared_gyms_count: number;
  common_gym_names: string[];
  mutual_friends_count: number;
  recommendation_source: 'gym' | 'mutual_friend' | 'nearby';
}

interface SearchResult {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const FriendRecommendations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendRequest, friends } = useFriends();
  const [recommendations, setRecommendations] = useState<FriendRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  // Debounced username search
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .neq('user_id', user?.id || '')
        .ilike('username', `%${query}%`)
        .limit(10);

      if (!error && data) {
        setSearchResults(data);
      }
      setSearching(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery, user?.id]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_comprehensive_friend_recommendations', {
        current_user_id: user?.id,
        limit_count: 20
      });

      if (error) {
        console.warn('Comprehensive recommendations failed, falling back to gym-based:', error);
        const { data: gymData, error: gymError } = await supabase.rpc('get_gym_based_friend_recommendations', {
          current_user_id: user?.id,
          limit_count: 20
        });
        if (gymError) throw gymError;
        setRecommendations((gymData || []).map((r: any) => ({ ...r, mutual_friends_count: 0, recommendation_source: 'gym' as const })));
      } else {
        setRecommendations((data || []).map((r: any) => ({ ...r, recommendation_source: r.recommendation_source as 'gym' | 'mutual_friend' | 'nearby' })));
      }
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
      setSearchResults(prev => prev.filter(r => r.user_id !== friendId));
    }
    
    setSendingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(friendId);
      return newSet;
    });
  };

  const friendIds = new Set(friends.map(f => f.user_id));

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'gym': return <MapPin className="w-4 h-4" />;
      case 'mutual_friend': return <UsersRound className="w-4 h-4" />;
      case 'nearby': return <MapPin className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'gym': return 'Shared gyms';
      case 'mutual_friend': return 'Mutual friends';
      case 'nearby': return 'Nearby';
      default: return 'Suggested';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Find Friends" showBackButton onBack={() => navigate(ROUTES.HOME)} />

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Search by Username */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Search by Username
            </CardTitle>
            <CardDescription>Find people by their username</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
            )}

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                {searchResults.map((result) => {
                  const isFriend = friendIds.has(result.user_id);
                  return (
                    <div key={result.user_id} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          {result.avatar_url && <AvatarImage src={result.avatar_url} />}
                          <AvatarFallback>{result.display_name?.[0] || result.username?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{result.display_name || result.username}</p>
                          <p className="text-sm text-muted-foreground truncate">@{result.username}</p>
                        </div>
                      </div>
                      {isFriend ? (
                        <Badge variant="secondary">Friends</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendFriendRequest(result.user_id)}
                          disabled={sendingRequests.has(result.user_id)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          {sendingRequests.has(result.user_id) ? 'Sending...' : 'Add'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Suggested Friends
            </CardTitle>
            <CardDescription>
              Connect with people based on shared gyms, mutual friends, or nearby locations
            </CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : recommendations.length === 0 ? (
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
                            {getSourceIcon(recommendation.recommendation_source)}
                            <span className="text-sm text-muted-foreground">
                              {recommendation.recommendation_source === 'gym' && recommendation.shared_gyms_count > 0 
                                ? `${recommendation.shared_gyms_count} shared ${recommendation.shared_gyms_count === 1 ? 'gym' : 'gyms'}`
                                : recommendation.recommendation_source === 'mutual_friend' && recommendation.mutual_friends_count > 0
                                ? `${recommendation.mutual_friends_count} mutual ${recommendation.mutual_friends_count === 1 ? 'friend' : 'friends'}`
                                : getSourceLabel(recommendation.recommendation_source)
                              }
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
