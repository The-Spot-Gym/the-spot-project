import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Loader2, UserPlus, MessageCircle, Trophy, Dumbbell, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ROUTES } from "@/constants/routes";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, LeaderboardStats } from "@/types";

const MyFriends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, loading } = useFriends();
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [friendStats, setFriendStats] = useState<LeaderboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const handleViewProfile = async (friend: Profile) => {
    setSelectedFriend(friend);
    setStatsLoading(true);

    const { data } = await supabase
      .from('leaderboard_stats')
      .select('*')
      .eq('user_id', friend.user_id)
      .maybeSingle();

    setFriendStats(data as LeaderboardStats | null);
    setStatsLoading(false);
  };

  const handleMessage = async (friend: Profile) => {
    if (!user) return;

    // Check for existing conversation
    const { data: myConvos } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (myConvos && myConvos.length > 0) {
      const { data: sharedConvo } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', friend.user_id)
        .in('conversation_id', myConvos.map(c => c.conversation_id));

      if (sharedConvo && sharedConvo.length > 0) {
        // Check it's a 1:1 conversation (not a group)
        for (const convo of sharedConvo) {
          const { data: convoData } = await supabase
            .from('conversations')
            .select('id, is_group')
            .eq('id', convo.conversation_id)
            .eq('is_group', false)
            .maybeSingle();

          if (convoData) {
            navigate(ROUTES.CHAT(convoData.id));
            return;
          }
        }
      }
    }

    // Create new conversation
    const { data: newConvo, error } = await supabase
      .from('conversations')
      .insert({ created_by: user.id, is_group: false })
      .select()
      .single();

    if (error || !newConvo) return;

    await supabase.from('conversation_participants').insert([
      { conversation_id: newConvo.id, user_id: user.id },
      { conversation_id: newConvo.id, user_id: friend.user_id },
    ]);

    navigate(ROUTES.CHAT(newConvo.id));
  };

  const formatWeight = (weight: number | null) => {
    if (!weight) return "0";
    return weight >= 1000 ? `${(weight / 1000).toFixed(1)}k` : String(weight);
  };

  const getPersonalRecords = (stats: LeaderboardStats | null) => {
    if (!stats?.personal_records) return null;
    const pr = stats.personal_records as Record<string, number>;
    return {
      bench: pr.bench_press || 0,
      squat: pr.squat || 0,
      deadlift: pr.deadlift || 0,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="My Friends" showBackButton />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="My Friends" showBackButton onBack={() => navigate(ROUTES.HOME)} />

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {friends.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Users}
                title="No friends yet"
              />
              <div className="text-center mt-4">
                <Button variant="fitness" onClick={() => navigate(ROUTES.FRIEND_RECOMMENDATIONS)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Find Friends
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {friends.map((friend) => {
              const displayName = friend.display_name || friend.username || 'Anonymous';

              return (
                <Card
                  key={friend.user_id}
                  className="hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleViewProfile(friend)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {displayName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{displayName}</p>
                        {friend.bio && (
                          <p className="text-sm text-muted-foreground truncate">{friend.bio}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMessage(friend);
                        }}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Friend Profile Dialog */}
      <Dialog open={!!selectedFriend} onOpenChange={(open) => !open && setSelectedFriend(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>

          {selectedFriend && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={selectedFriend.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {(selectedFriend.display_name || selectedFriend.username)?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedFriend.display_name || selectedFriend.username}
                  </h2>
                  {selectedFriend.display_name && selectedFriend.username && (
                    <p className="text-sm text-muted-foreground">@{selectedFriend.username}</p>
                  )}
                  {selectedFriend.bio && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedFriend.bio}</p>
                  )}
                </div>
              </div>

              {/* Lift Stats */}
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : friendStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{friendStats.total_workouts || 0}</p>
                      <p className="text-xs text-muted-foreground">Workouts</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{friendStats.current_streak || 0}</p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{formatWeight(friendStats.total_weight_lifted)}</p>
                      <p className="text-xs text-muted-foreground">lbs lifted</p>
                    </div>
                  </div>

                  {/* Personal Records */}
                  {(() => {
                    const pr = getPersonalRecords(friendStats);
                    if (!pr || (pr.bench === 0 && pr.squat === 0 && pr.deadlift === 0)) return null;
                    return (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-warning" />
                          Personal Records
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {pr.bench > 0 && (
                            <div className="border rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold">{pr.bench}</p>
                              <p className="text-xs text-muted-foreground">Bench</p>
                            </div>
                          )}
                          {pr.squat > 0 && (
                            <div className="border rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold">{pr.squat}</p>
                              <p className="text-xs text-muted-foreground">Squat</p>
                            </div>
                          )}
                          {pr.deadlift > 0 && (
                            <div className="border rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold">{pr.deadlift}</p>
                              <p className="text-xs text-muted-foreground">Deadlift</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {friendStats.favorite_exercise && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Dumbbell className="w-4 h-4" />
                      Favorite: <span className="font-medium text-foreground">{friendStats.favorite_exercise}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No workout stats yet</p>
              )}

              {/* Actions */}
              <Button
                variant="fitness"
                className="w-full"
                onClick={() => {
                  setSelectedFriend(null);
                  handleMessage(selectedFriend);
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyFriends;
