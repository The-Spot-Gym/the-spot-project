import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Users, MessageCircle, UserPlus, Clock, Wifi, Car, Shield, Trophy, Phone, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Leaderboard from "@/components/Leaderboard";

const GymDetails = () => {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasJoined, setHasJoined] = useState(false);
  const [gymData, setGymData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  useEffect(() => {
    fetchGymDetails();
    checkUser();
  }, [gymId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user && gymId) {
      checkMembership(user.id);
    }
  };

  const checkMembership = async (userId: string) => {
    const { data } = await supabase
      .from('gym_memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .maybeSingle();
    
    setHasJoined(!!data);
  };

  const fetchGymDetails = async () => {
    if (!gymId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-gym-details', {
        body: { gymId },
      });

      if (error) throw error;

      setGymData(data.gym);
    } catch (error) {
      console.error('Error fetching gym details:', error);
      toast({
        title: "Error loading gym details",
        description: "Failed to load gym information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const [gymMembers, setGymMembers] = useState<any[]>([]);

  const fetchGymMembers = async () => {
    if (!gymId) return;
    
    const { data, error } = await supabase
      .from('gym_memberships')
      .select(`
        user_id,
        joined_at,
        profiles!inner(
          display_name,
          username,
          avatar_url
        )
      `)
      .eq('gym_id', gymId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching gym members:', error);
      return;
    }

    setGymMembers(data || []);
  };

  useEffect(() => {
    if (hasJoined) {
      fetchGymMembers();
    }
  }, [hasJoined, gymId]);

  const handleJoinGym = async () => {
    if (!currentUser || !gymId) {
      toast({
        title: "Error",
        description: "You must be logged in to join a gym.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('gym_memberships')
        .insert({
          user_id: currentUser.id,
          gym_id: gymId,
          is_active: true
        });

      if (error) throw error;

      setHasJoined(true);
      toast({
        title: "Success!",
        description: `You've joined ${gymData?.name}!`,
      });
    } catch (error: any) {
      console.error('Error joining gym:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join gym. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGym = async () => {
    if (!currentUser || !gymId) return;

    try {
      const { error } = await supabase
        .from('gym_memberships')
        .update({ is_active: false })
        .eq('user_id', currentUser.id)
        .eq('gym_id', gymId);

      if (error) throw error;

      setHasJoined(false);
      toast({
        title: "Left gym",
        description: `You've left ${gymData?.name}`,
      });
    } catch (error: any) {
      console.error('Error leaving gym:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to leave gym. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendFriendRequest = (memberName: string) => {
    // Handle friend request logic
    console.log(`Sending friend request to ${memberName}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
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
            {gymData.photo_url && (
              <img 
                src={gymData.photo_url} 
                alt={gymData.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="font-bold text-xl">{gymData.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {gymData.rating && (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning text-warning" />
                      <span>{gymData.rating}</span>
                    </div>
                    <span>•</span>
                  </>
                )}
                {gymData.user_ratings_total && (
                  <span>{gymData.user_ratings_total} reviews</span>
                )}
              </div>
            </div>
          </div>
          <div className="ml-auto flex gap-2">
            {!hasJoined ? (
              <Button variant="fitness" onClick={handleJoinGym}>
                <UserPlus className="w-4 h-4 mr-2" />
                Join Gym
              </Button>
            ) : (
              <>
                <Badge variant="success">
                  <Users className="w-4 h-4 mr-1" />
                  Member
                </Badge>
                <Button variant="outline" size="sm" onClick={handleLeaveGym}>
                  Leave Gym
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({gymData.reviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6">
              {/* Photos */}
              {gymData.photos && gymData.photos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Photos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {gymData.photos.map((photo: string, index: number) => (
                        <img 
                          key={index}
                          src={photo}
                          alt={`${gymData.name} photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {gymData.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{gymData.address}</span>
                        </div>
                      )}
                      
                      {gymData.phone_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <a href={`tel:${gymData.phone_number}`} className="hover:underline">
                            {gymData.phone_number}
                          </a>
                        </div>
                      )}
                      
                      {gymData.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="w-4 h-4 flex-shrink-0" />
                          <a 
                            href={gymData.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline truncate"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>

                    {gymData.opening_hours && (
                      <div className="space-y-2 pt-4 border-t">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Hours
                        </h4>
                        {gymData.opening_hours.weekday_text ? (
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {gymData.opening_hours.weekday_text.map((day: string, index: number) => (
                              <div key={index}>{day}</div>
                            ))}
                          </div>
                        ) : gymData.opening_hours.open_now !== undefined && (
                          <Badge variant={gymData.opening_hours.open_now ? "success" : "secondary"}>
                            {gymData.opening_hours.open_now ? "Open Now" : "Closed"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ratings & Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {gymData.rating && (
                      <div className="text-center p-6 bg-gradient-primary rounded-lg text-white">
                        <div className="text-4xl font-bold">{gymData.rating}</div>
                        <div className="text-sm opacity-90 mt-1">Overall Rating</div>
                        <div className="flex justify-center mt-2">
                          {[1,2,3,4,5].map(star => (
                            <Star 
                              key={star} 
                              className={`w-5 h-5 ${star <= Math.round(gymData.rating) ? 'fill-current' : ''}`}
                            />
                          ))}
                        </div>
                        {gymData.user_ratings_total && (
                          <div className="text-sm opacity-90 mt-2">
                            Based on {gymData.user_ratings_total} reviews
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {/* Star Filter Buttons */}
            {gymData.reviews && gymData.reviews.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                <Button
                  variant={selectedRating === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRating(null)}
                >
                  All Reviews
                </Button>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = gymData.reviews.filter((r: any) => r.rating === rating).length;
                  return (
                    <Button
                      key={rating}
                      variant={selectedRating === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRating(rating)}
                      disabled={count === 0}
                    >
                      <Star className="w-4 h-4 mr-1 fill-warning text-warning" />
                      {rating} ({count})
                    </Button>
                  );
                })}
              </div>
            )}
            
            <div className="grid gap-4">
              {gymData.reviews && gymData.reviews.length > 0 ? (
                gymData.reviews
                  .filter((review: any) => selectedRating === null || review.rating === selectedRating)
                  .map((review: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.profile_photo_url} />
                          <AvatarFallback>{review.author_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{review.author_name}</h4>
                            <span className="text-sm text-muted-foreground">
                              {review.relative_time_description}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {[1,2,3,4,5].map(star => (
                              <Star 
                                key={star} 
                                className={`w-4 h-4 ${star <= review.rating ? 'fill-warning text-warning' : 'text-muted'}`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.text}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No reviews yet</p>
                </Card>
              )}
              
              {gymData.reviews && gymData.reviews.length > 0 && 
                gymData.reviews.filter((review: any) => selectedRating === null || review.rating === selectedRating).length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No {selectedRating}-star reviews found</p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <div className="grid gap-4">
              {hasJoined ? (
                gymMembers.length > 0 ? (
                  gymMembers.map((membership, index) => {
                    const profile = membership.profiles as any;
                    const displayName = profile?.display_name || profile?.username || 'Anonymous';
                    
                    return (
                      <Card key={index} className="hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={profile?.avatar_url} />
                                <AvatarFallback className="bg-gradient-primary text-white">
                                  {displayName[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{displayName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Member since {new Date(membership.joined_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {membership.user_id !== currentUser?.id && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSendFriendRequest(displayName)}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Add Friend
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="text-center p-8">
                    <CardContent>
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No Members Yet</h3>
                      <p className="text-muted-foreground">
                        Be the first to build a community at {gymData.name}!
                      </p>
                    </CardContent>
                  </Card>
                )
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