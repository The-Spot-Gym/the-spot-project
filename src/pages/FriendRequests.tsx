import { useNavigate } from "react-router-dom";
import { UserPlus, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFriends } from "@/hooks/useFriends";
import { useProfile } from "@/hooks/useProfile";
import { profileService } from "@/services/profileService";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ROUTES } from "@/constants/routes";
import { useState, useEffect } from "react";
import type { Profile } from "@/types";

const FriendRequests = () => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { pendingRequests, sentRequests, loading, acceptRequest, rejectRequest } = useFriends();
  const [requestProfiles, setRequestProfiles] = useState<Record<string, Profile>>({});

  // Fetch profiles for all requests
  useEffect(() => {
    const fetchProfiles = async () => {
      const userIds = [
        ...pendingRequests.map(r => r.user_id),
        ...sentRequests.map(r => r.friend_id),
      ];
      
      const profiles: Record<string, Profile> = {};
      await Promise.all(
        userIds.map(async (userId) => {
          const profile = await profileService.getProfileByUserId(userId);
          if (profile) {
            profiles[userId] = profile;
          }
        })
      );
      
      setRequestProfiles(profiles);
    };

    if (pendingRequests.length > 0 || sentRequests.length > 0) {
      fetchProfiles();
    }
  }, [pendingRequests, sentRequests]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Friend Requests" showBackButton />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Friend Requests" showBackButton onBack={() => navigate(ROUTES.HOME)} />

      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-6">
          {/* Received Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4">Received Requests</h2>
              <div className="space-y-2">
                {pendingRequests.map((request) => {
                  const userProfile = requestProfiles[request.user_id];
                  return (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="w-12 h-12 flex-shrink-0">
                              {userProfile?.avatar_url && <AvatarImage src={userProfile.avatar_url} />}
                              <AvatarFallback>
                                {userProfile?.display_name?.[0] || userProfile?.username?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold truncate">
                                {userProfile?.display_name || userProfile?.username || 'Unknown User'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              onClick={() => acceptRequest(request.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectRequest(request.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sent Requests */}
          {sentRequests.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4">Sent Requests</h2>
              <div className="space-y-2">
                {sentRequests.map((request) => {
                  const friendProfile = requestProfiles[request.friend_id];
                  return (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="w-12 h-12 flex-shrink-0">
                              {friendProfile?.avatar_url && <AvatarImage src={friendProfile.avatar_url} />}
                              <AvatarFallback>
                                {friendProfile?.display_name?.[0] || friendProfile?.username?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold truncate">
                                {friendProfile?.display_name || friendProfile?.username || 'Unknown User'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Sent {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">Pending</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {pendingRequests.length === 0 && sentRequests.length === 0 && (
            <Card className="p-12">
              <EmptyState
                icon={UserPlus}
                title="No friend requests"
                description="Start connecting with people at your gym to send friend requests"
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;
