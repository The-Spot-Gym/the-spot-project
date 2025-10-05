import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, Trophy, Dumbbell, User, Star, LogOut, Loader2, Search, SlidersHorizontal, Settings, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Welcome from "./Welcome";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [gyms, setGyms] = useState<any[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");

  // Fetch user profile when authenticated
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setUserProfile(data);
        } else {
          // Fallback to user metadata
          setUserProfile({ 
            username: user.user_metadata?.username || 'User', 
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || 'Fitness Enthusiast'
          });
        }
      }
    };

    fetchProfile();
  }, [user]);

  // Get user location
  useEffect(() => {
    if (user && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location access denied",
            description: "Using default location. Please enable location access for better results.",
            variant: "destructive",
          });
          // Default to a location (e.g., New York City)
          setUserLocation({ latitude: 40.7128, longitude: -74.0060 });
        }
      );
    }
  }, [user, toast]);

  // Fetch gyms when location is available
  useEffect(() => {
    if (userLocation) {
      fetchNearbyGyms();
    }
  }, [userLocation]);

  const fetchNearbyGyms = async () => {
    if (!userLocation) return;

    setLoadingGyms(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-nearby-gyms', {
        body: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 5000, // 5km radius
        },
      });

      if (error) throw error;

      setGyms(data.gyms || []);
    } catch (error) {
      console.error('Error fetching gyms:', error);
      toast({
        title: "Error loading gyms",
        description: "Failed to load nearby gyms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingGyms(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Return as number for sorting
  };

  // Filter and sort gyms
  const filteredAndSortedGyms = useMemo(() => {
    if (!userLocation) return [];

    // Add distance to each gym
    const gymsWithDistance = gyms.map(gym => ({
      ...gym,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        gym.latitude,
        gym.longitude
      )
    }));

    // Filter by search query
    let filtered = gymsWithDistance;
    const hasSearchQuery = searchQuery.trim().length > 0;
    
    if (hasSearchQuery) {
      // If searching, show all matching gyms regardless of quality
      filtered = gymsWithDistance.filter(gym =>
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      // If not searching, filter out low-quality gyms
      filtered = gymsWithDistance.filter(gym => {
        // Must have at least 10 reviews AND rating must be above 1.0
        const hasEnoughReviews = gym.user_ratings_total && gym.user_ratings_total >= 10;
        const hasDecentRating = gym.rating && gym.rating > 1.0;
        return hasEnoughReviews && hasDecentRating;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "distance") {
        return a.distance - b.distance;
      } else if (sortBy === "rating") {
        // Sort by rating descending (highest first), handle null ratings
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      }
      return 0;
    });

    return sorted;
  }, [gyms, userLocation, searchQuery, sortBy]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Early returns AFTER all hooks are called
  if (!loading && !user) {
    return <Welcome />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  // Main authenticated view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-card p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">The Spot</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:flex">
              Welcome {userProfile?.display_name || userProfile?.username || 'User'}!
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="w-8 h-8">
                    {userProfile?.avatar_url && <AvatarImage src={userProfile.avatar_url} />}
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {(userProfile?.display_name?.[0] || userProfile?.username?.[0] || 'U').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userProfile?.display_name || userProfile?.username || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile-setup')}>
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast({ title: "Coming soon!", description: "Workout history feature is under development." })}>
                  <History className="w-4 h-4 mr-2" />
                  History
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gyms Near You</h1>
          <p className="text-muted-foreground">Discover your perfect fitness community</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search gyms by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value: "distance" | "rating") => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loadingGyms ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredAndSortedGyms.length === 0 ? (
          <Card className="p-8 text-center">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground">No gyms found matching "{searchQuery}"</p>
                <Button onClick={() => setSearchQuery("")} className="mt-4" variant="outline">
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">No gyms found nearby. Try adjusting your location permissions.</p>
                <Button onClick={fetchNearbyGyms} className="mt-4" variant="fitness">
                  Retry
                </Button>
              </>
            )}
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filteredAndSortedGyms.length} {filteredAndSortedGyms.length === 1 ? 'gym' : 'gyms'}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
            <div className="grid gap-6">
              {filteredAndSortedGyms.map((gym) => (
                <Card 
                  key={gym.id} 
                  className="hover:shadow-card transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/gym/${gym.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {gym.photo_url && (
                        <img 
                          src={gym.photo_url} 
                          alt={gym.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{gym.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {gym.rating && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-warning text-warning" />
                                    <span>{gym.rating}</span>
                                  </div>
                                  <span>•</span>
                                </>
                              )}
                              <span>{gym.distance.toFixed(1)} km away</span>
                              {gym.user_ratings_total && (
                                <>
                                  <span>•</span>
                                  <span>{gym.user_ratings_total} reviews</span>
                                </>
                              )}
                            </div>
                            {gym.address && (
                              <p className="text-xs text-muted-foreground mt-1">{gym.address}</p>
                            )}
                          </div>
                          <Button variant="fitness">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button variant="outline" size="lg" onClick={fetchNearbyGyms} disabled={loadingGyms}>
                {loadingGyms ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Refresh Gyms
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;