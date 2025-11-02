import { Users, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/EmptyState";
import { useFriends } from "@/hooks/useFriends";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

export const FriendsTab = () => {
  const navigate = useNavigate();
  const { friends, loading } = useFriends();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Friends
          </CardTitle>
          <CardDescription>Manage your gym friends</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : friends.length === 0 ? (
            <div>
              <EmptyState
                icon={Users}
                title="No friends yet"
                description="Add friends to connect with people at your gym"
              />
              <div className="text-center mt-4 space-x-2">
                <Button onClick={() => navigate(ROUTES.FRIEND_RECOMMENDATIONS)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Find Friends
                </Button>
                <Button variant="outline" onClick={() => navigate(ROUTES.FRIEND_REQUESTS)}>
                  View Requests
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback>
                        {friend.display_name?.[0] || friend.username?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.display_name || friend.username}</p>
                      {friend.username && friend.display_name !== friend.username && (
                        <p className="text-sm text-muted-foreground">@{friend.username}</p>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => navigate(ROUTES.FRIEND_RECOMMENDATIONS)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Find Friends
        </Button>
        <Button variant="outline" onClick={() => navigate(ROUTES.FRIEND_REQUESTS)}>
          View Friend Requests
        </Button>
      </div>
    </div>
  );
};
