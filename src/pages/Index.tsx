import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, Trophy, Dumbbell, User, Star, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // Fetch user profile when authenticated
  useEffect(() => {
    if (user) {
      // TODO: Fetch user profile from Supabase
      setUserProfile({ username: 'User', display_name: 'Fitness Enthusiast' });
    }
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
    return (R * c).toFixed(1);
  };

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
            <Badge variant="secondary">
              Welcome {userProfile?.display_name || userProfile?.username || 'User'}!
            </Badge>
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gyms Near You</h1>
          <p className="text-muted-foreground">Discover your perfect fitness community</p>
        </div>

        {loadingGyms ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : gyms.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No gyms found nearby. Try adjusting your location permissions.</p>
            <Button onClick={fetchNearbyGyms} className="mt-4" variant="fitness">
              Retry
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-6">
              {gyms.map((gym) => (
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
                              {userLocation && (
                                <>
                                  <span>{calculateDistance(
                                    userLocation.latitude,
                                    userLocation.longitude,
                                    gym.latitude,
                                    gym.longitude
                                  )} km away</span>
                                  <span>•</span>
                                </>
                              )}
                              {gym.user_ratings_total && (
                                <span>{gym.user_ratings_total} reviews</span>
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