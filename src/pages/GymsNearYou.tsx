import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Loader2, Search, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { calculateDistance, formatDistance } from "@/utils/distance";

const GymsNearYou = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [gyms, setGyms] = useState<any[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "reviews">("distance");

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
          handleError(error, "Location access denied. Using default location. Please enable location access for better results.");
          setUserLocation({ latitude: 40.7128, longitude: -74.0060 });
        }
      );
    }
  }, [user, handleError]);

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
      handleError(error, "Failed to load nearby gyms. Please try again.");
    } finally {
      setLoadingGyms(false);
    }
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
      filtered = gymsWithDistance.filter(gym =>
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      filtered = gymsWithDistance.filter(gym => {
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
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      } else if (sortBy === "reviews") {
        const reviewsA = a.user_ratings_total || 0;
        const reviewsB = b.user_ratings_total || 0;
        return reviewsB - reviewsA;
      }
      return 0;
    });

    return sorted;
  }, [gyms, userLocation, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm p-4 sticky top-0 z-10 border-b">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-xl">Gyms Near You</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
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
            <Select value={sortBy} onValueChange={(value: "distance" | "rating" | "reviews") => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="reviews">Reviews</SelectItem>
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
                              <span>{formatDistance(gym.distance)} away</span>
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

export default GymsNearYou;
