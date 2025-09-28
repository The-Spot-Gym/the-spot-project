import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Users, MessageCircle, UserPlus, Clock, Wifi, Car, Shield, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Leaderboard from "@/components/Leaderboard";

const GymDetails = () => {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);

  // Mock gym data - in real app this would come from API based on gymId
  const gymData = {
    id: gymId,
    name: "Iron Paradise Gym",
    rating: 4.8,
    distance: "0.3 miles",
    members: 234,
    description: "A community-focused gym with top-tier equipment and supportive atmosphere. Perfect for serious lifters and beginners alike.",
    image: "🏋️",
    amenities: [
      { icon: <Clock className="w-4 h-4" />, label: "24/7 Access" },
      { icon: <Wifi className="w-4 h-4" />, label: "Free WiFi" },
      { icon: <Car className="w-4 h-4" />, label: "Free Parking" },
      { icon: <Shield className="w-4 h-4" />, label: "Security System" },
    ],
    hours: "24/7 Access Available",
    address: "123 Fitness Ave, Your City",
    phone: "(555) 123-4567"
  };

  const gymMembers = [
    { name: "Mike Chen", avatar: "MC", status: "online", lastSeen: "Active now", canMessage: false },
    { name: "Sarah Johnson", avatar: "SJ", status: "online", lastSeen: "Active now", canMessage: true },
    { name: "Alex Rivera", avatar: "AR", status: "offline", lastSeen: "2 hours ago", canMessage: true },
    { name: "David Kim", avatar: "DK", status: "online", lastSeen: "Active now", canMessage: false },
    { name: "Emma Wilson", avatar: "EW", status: "offline", lastSeen: "1 day ago", canMessage: true },
    { name: "James Miller", avatar: "JM", status: "online", lastSeen: "Active now", canMessage: true },
  ];

  const handleJoinGym = () => {
    setHasJoined(true);
  };

  const handleSendFriendRequest = (memberName: string) => {
    // Handle friend request logic
    console.log(`Sending friend request to ${memberName}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-card p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{gymData.image}</span>
            <div>
              <h1 className="font-bold text-xl">{gymData.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  <span>{gymData.rating}</span>
                </div>
                <span>•</span>
                <span>{gymData.distance}</span>
              </div>
            </div>
          </div>
          <div className="ml-auto">
            {!hasJoined ? (
              <Button variant="fitness" onClick={handleJoinGym}>
                <UserPlus className="w-4 h-4 mr-2" />
                Join Gym
              </Button>
            ) : (
              <Badge variant="success">
                <Users className="w-4 h-4 mr-1" />
                Member
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members ({gymData.members})</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>About This Gym</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{gymData.description}</p>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Amenities</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {gymData.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {amenity.icon}
                          <span>{amenity.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Contact Info</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{gymData.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{gymData.hours}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{gymData.members}</div>
                      <div className="text-sm text-muted-foreground">Total Members</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-success">24</div>
                      <div className="text-sm text-muted-foreground">Online Now</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-primary rounded-lg text-white">
                    <div className="text-2xl font-bold">4.8</div>
                    <div className="text-sm opacity-90">Community Rating</div>
                    <div className="flex justify-center mt-1">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="grid gap-4">
              {hasJoined ? (
                gymMembers.map((member, index) => (
                  <Card key={index} className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="bg-gradient-primary text-white">
                                {member.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              member.status === 'online' ? 'bg-success' : 'bg-muted-foreground'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.lastSeen}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {member.canMessage ? (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSendFriendRequest(member.name)}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Add Friend
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline">Friend Request Sent</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="text-center p-8">
                  <CardContent>
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Join to See Members</h3>
                    <p className="text-muted-foreground mb-4">
                      Join {gymData.name} to connect with other members and find your workout buddies!
                    </p>
                    <Button variant="fitness" onClick={handleJoinGym}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join Gym
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            {hasJoined ? (
              <Leaderboard gymName={gymData.name} />
            ) : (
              <Card className="text-center p-8">
                <CardContent>
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Join to See Leaderboards</h3>
                  <p className="text-muted-foreground mb-4">
                    See who's leading in bench press, squat, and deadlift competitions!
                  </p>
                  <Button variant="fitness" onClick={handleJoinGym}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Gym
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GymDetails;