import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Users, MessageCircle, UserPlus, Clock, Phone, Globe, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Leaderboard from "@/components/Leaderboard";
import { useGymDetails } from "@/hooks/useGymDetails";

const GymDetails = () => {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const { 
    gymData, 
    loading, 
    hasJoined,
    gymMembers,
    currentUser,
    joinGym, 
    leaveGym 
  } = useGymDetails(gymId);

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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3 sm:mb-0">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
              className="flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {gymData.photo_url && (
                <img 
                  src={gymData.photo_url} 
                  alt={gymData.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-lg sm:text-xl truncate">{gymData.name}</h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  {gymData.rating && (
                    <>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-warning text-warning flex-shrink-0" />
                        <span>{gymData.rating}</span>
                      </div>
                      <span>•</span>
                    </>
                  )}
                  {gymData.user_ratings_total && (
                    <span className="truncate">{gymData.user_ratings_total} reviews</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:absolute sm:right-4 sm:top-4">
            {!hasJoined ? (
              <Button variant="fitness" onClick={joinGym} size="sm" className="flex-1 sm:flex-initial">
                <UserPlus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Join Gym</span>
              </Button>
            ) : (
              <>
                <Badge variant="success" className="flex-1 sm:flex-initial justify-center">
                  <Users className="w-4 h-4 mr-1" />
                  Member
                </Badge>
                <Button variant="outline" size="sm" onClick={leaveGym} className="flex-1 sm:flex-initial">
                  Leave
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
                                  Member since {new Date(membership.joined_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {membership.user_id !== currentUser?.id && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSendFriendRequest(displayName)}
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
                    <Button variant="fitness" onClick={joinGym}>
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
                  <Button variant="fitness" onClick={joinGym}>
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