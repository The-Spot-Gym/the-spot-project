import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Loader2, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FriendProfileDialog } from "@/components/friends/FriendProfileDialog";
import { ROUTES } from "@/constants/routes";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

const MyFriends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, loading } = useFriends();
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);

  const handleMessage = async (friend: Profile) => {
    if (!user) return;

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
              <EmptyState icon={Users} title="No friends yet" />
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
                  onClick={() => setSelectedFriend(friend)}
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
                        onClick={(e) => { e.stopPropagation(); handleMessage(friend); }}
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

      <FriendProfileDialog
        friend={selectedFriend}
        onClose={() => setSelectedFriend(null)}
        onMessage={handleMessage}
      />
    </div>
  );
};

export default MyFriends;
