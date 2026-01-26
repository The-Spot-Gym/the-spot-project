import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Leaderboard from "@/components/Leaderboard";
import { useGymDetails } from "@/hooks/useGymDetails";
import { useGymMembers } from "@/hooks/useGymMembers";
import { useGymMembership } from "@/hooks/useGymMembership";
import { GymHeader } from "@/components/gym/GymHeader";
import { GymInfo } from "@/components/gym/GymInfo";
import { GymReviewsList } from "@/components/gym/GymReviewsList";
import { GymMembersList } from "@/components/gym/GymMembersList";
import { LoadingState } from "@/components/LoadingState";

const GymDetails = () => {
  const { gymId } = useParams();
  const navigate = useNavigate();

  const { gymData, loading: gymLoading, currentUser } = useGymDetails(gymId || null);
  const { members, loading: membersLoading } = useGymMembers(gymId || null);
  const { isMember, joinGym, leaveGym } = useGymMembership(gymId || null);

  // Reviews come from gymData (fetched from Google Places API)
  const reviews = gymData?.reviews || [];

  const handleSendFriendRequest = (memberName: string) => {
    console.log(`Sending friend request to ${memberName}`);
  };

  if (gymLoading) {
    return <LoadingState message="Loading gym details..." fullScreen />;
  }

  if (!gymData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Gym not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GymHeader 
        gymData={gymData}
        hasJoined={isMember}
        onBack={() => navigate('/')}
        onJoin={joinGym}
        onLeave={leaveGym}
      />

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6">
              <GymInfo gymData={gymData} />
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <GymReviewsList reviews={reviews} />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            {membersLoading ? (
              <LoadingState message="Loading members..." />
            ) : (
              <GymMembersList 
                hasJoined={isMember}
                members={members}
                currentUserId={currentUser?.id}
                gymName={gymData.name}
                onJoinGym={joinGym}
                onAddFriend={handleSendFriendRequest}
              />
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Leaderboard gymName={gymData.name} hasJoined={isMember} onJoinGym={joinGym} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GymDetails;