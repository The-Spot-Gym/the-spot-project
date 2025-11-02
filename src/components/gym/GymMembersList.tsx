import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/utils/date";
import type { GymMemberData } from "@/types/api";

interface GymMembersListProps {
  hasJoined: boolean;
  members: GymMemberData[];
  currentUserId?: string;
  gymName: string;
  onJoinGym: () => void;
  onAddFriend: (memberName: string) => void;
}

export const GymMembersList = ({ 
  hasJoined, 
  members, 
  currentUserId, 
  gymName,
  onJoinGym,
  onAddFriend 
}: GymMembersListProps) => {
  if (!hasJoined) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Join to See Members</h3>
          <p className="text-muted-foreground mb-4">
            Join {gymName} to connect with other members and find your workout buddies!
          </p>
          <Button variant="fitness" onClick={onJoinGym}>
            <UserPlus className="w-4 h-4 mr-2" />
            Join Gym
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardContent>
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No Members Yet</h3>
          <p className="text-muted-foreground">
            Be the first to build a community at {gymName}!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {members.map((membership, index) => {
        const profile = membership.profiles as any;
        const displayName = profile?.display_name || profile?.username || 'Anonymous';
        
        return (
          <Card key={index} className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{displayName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Member since {formatDate(membership.joined_at)}
                    </p>
                  </div>
                </div>
                
                {membership.user_id !== currentUserId && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAddFriend(displayName)}
                    className="w-full sm:w-auto flex-shrink-0"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add Friend
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
