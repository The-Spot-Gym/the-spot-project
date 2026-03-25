import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Loader2, Search, SlidersHorizontal, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { calculateDistance, formatDistance } from "@/utils/distance";
import { PageHeader } from "@/components/PageHeader";
import { ROUTES } from "@/constants/routes";
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import AddressAutocomplete from "@/components/AddressAutocomplete";

const LOCATION_PROMPTED_KEY = 'gyms_location_prompted';

const GymsNearYou = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [gyms, setGyms] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [searchingGyms, setSearchingGyms] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "popularity">("popularity");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [locationLoading, setLocationLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasPromptedBefore, setHasPromptedBefore] = useState(() => {
    return localStorage.getItem(LOCATION_PROMPTED_KEY) === 'true';
  });

  // Auto-request location on mount if user has granted before
  useEffect(() => {
    if (hasPromptedBefore && !userLocation && !locationLoading) {
      requestLocation();
    }
  }, []);

  // Request location permission and get location
  const requestLocation = async () => {
    setLocationLoading(true);
    setErrorMessage(null);
    setPermissionDenied(false);
    
    try {
      const isNative = Capacitor.isNativePlatform();
      console.log('Requesting location, isNative:', isNative);
      
      if (isNative) {
        // Use Capacitor Geolocation for native
        const permissionStatus = await Geolocation.requestPermissions();
        console.log('Permission status:', permissionStatus);
        
        if (permissionStatus.location === 'granted' || permissionStatus.coarseLocation === 'granted') {
          localStorage.setItem(LOCATION_PROMPTED_KEY, 'true');
          setHasPromptedBefore(true);
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });
          console.log('Got position:', position.coords);
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } else {
          console.log('Location permission denied');
          setPermissionDenied(true);
          setErrorMessage("Location permission denied. Please enable it in your device settings.");
        }
      } else {
        // Use web geolocation API for browser
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              localStorage.setItem(LOCATION_PROMPTED_KEY, 'true');
              setHasPromptedBefore(true);
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              console.error('Web geolocation error:', error);
              setPermissionDenied(true);
              setErrorMessage("Location access denied. Please enable location in your browser.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          setErrorMessage("Geolocation is not supported by your browser.");
        }
      }
    } catch (error: any) {
      console.error('Location error:', error);
      setErrorMessage(error.message || "Failed to get your location. Please try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch gyms when location becomes available
  useEffect(() => {
    if (userLocation && gyms.length === 0) {
      fetchNearbyGyms();
    }
  }, [userLocation]);

  const fetchNearbyGyms = async () => {
    if (!userLocation) {
      // If no location yet, request it first
      await requestLocation();
      return;
    }
    
    if (loadingGyms) return;

    setLoadingGyms(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-nearby-gyms', {
        body: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 5000, // 5km radius
        },
      });

      if (error) throw error;

      if (data?.limit_reached) {
        setErrorMessage(data.message || "Daily search limit reached. Try again tomorrow!");
        return;
      }

      setGyms(data.gyms || []);
      setErrorMessage(null);
    } catch (error: any) {
      const message = error?.message?.includes('limit') 
        ? "You've reached your daily gym search limit (2/day). Try again tomorrow!"
        : "Failed to load nearby gyms. Please try again.";
      handleError(error, message);
      setErrorMessage(message);
    } finally {
      setLoadingGyms(false);
    }
  };

  // Search for gyms remotely when query doesn't match local results
  const searchGymsRemotely = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchingGyms(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-nearby-gyms', {
        body: {
          searchQuery: query,
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        },
      });

      if (error) throw error;

      if (data?.limit_reached) {
        setSearchResults([]);
        return;
      }

      setSearchResults(data.gyms || []);
    } catch (error: any) {
      console.error('Error searching gyms:', error);
      setSearchResults([]);
    } finally {
      setSearchingGyms(false);
    }
  }, [userLocation]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        // Check if local results exist
        const localMatches = gyms.filter(gym =>
          gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gym.address?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        // If no local matches, search remotely
        if (localMatches.length === 0) {
          searchGymsRemotely(searchQuery);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, gyms, searchGymsRemotely]);

  // Filter and sort gyms
  const filteredAndSortedGyms = useMemo(() => {
    // Combine local gyms and remote search results
    const allGyms = [...gyms];
    
    // Add search results that aren't already in the list
    for (const searchGym of searchResults) {
      if (!allGyms.find(g => g.id === searchGym.id)) {
        allGyms.push(searchGym);
      }
    }

    // Add distance to each gym (if user location available)
    const gymsWithDistance = allGyms.map(gym => ({
      ...gym,
      distance: userLocation 
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            gym.latitude,
            gym.longitude
          )
        : null
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
      if (sortBy === "distance" && a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      } else if (sortBy === "rating") {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      } else if (sortBy === "popularity") {
        const reviewsA = a.user_ratings_total || 0;
        const reviewsB = b.user_ratings_total || 0;
        return reviewsB - reviewsA;
      }
      return 0;
    });

    return sorted;
  }, [gyms, searchResults, userLocation, searchQuery, sortBy]);

  // Gyms to display (limited by displayLimit)
  const displayedGyms = filteredAndSortedGyms.slice(0, displayLimit);
  const hasMoreGyms = filteredAndSortedGyms.length > displayLimit;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PageHeader title="Gyms Near You" showBackButton onBack={() => navigate(ROUTES.HOME)} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-muted-foreground">Discover your perfect fitness community</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search any gym..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            {searchingGyms && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2 w-full">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Select value={sortBy} onValueChange={(value: "distance" | "rating" | "popularity") => setSortBy(value)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Initial state - no location yet (only show if never prompted before) */}
        {!userLocation && !locationLoading && !loadingGyms && !hasPromptedBefore && (
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Find Gyms Near You</h3>
            <p className="text-muted-foreground mb-4">
              Allow location access to discover fitness centers in your area
            </p>
            <Button onClick={requestLocation} variant="fitness" size="lg">
              <MapPin className="w-4 h-4 mr-2" />
              Enable Location
            </Button>
          </Card>
        )}

        {/* Loading location */}
        {locationLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Getting your location...</p>
          </div>
        )}

        {/* Loading gyms */}
        {loadingGyms && !locationLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Finding gyms near you...</p>
          </div>
        )}

        {/* Permission denied state */}
        {permissionDenied && !locationLoading && (
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Location Access Required</h3>
            <p className="text-muted-foreground mb-4">
              Please enable location access in your device settings to find nearby gyms.
            </p>
            <Button onClick={requestLocation} variant="fitness">
              Try Again
            </Button>
          </Card>
        )}

        {/* No gyms found state */}
        {!loadingGyms && !locationLoading && !searchingGyms && filteredAndSortedGyms.length === 0 && (
          <Card className="p-8 text-center">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground">No gyms found matching "{searchQuery}"</p>
                <p className="text-xs text-muted-foreground mt-2">Try searching for a different gym name or location</p>
                <Button onClick={() => setSearchQuery("")} className="mt-4" variant="outline">
                  Clear Search
                </Button>
              </>
            ) : userLocation ? (
              <>
                <p className="text-muted-foreground">No gyms found nearby.</p>
                <Button onClick={fetchNearbyGyms} className="mt-4" variant="fitness">
                  Retry
                </Button>
              </>
            ) : (
              <>
                <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Search for a gym by name to get started</p>
              </>
            )}
          </Card>
        )}

        {/* Gyms list */}
        {!loadingGyms && !locationLoading && filteredAndSortedGyms.length > 0 && (
          <>
            <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
              <span>
                Showing {displayedGyms.length} of {filteredAndSortedGyms.length} {filteredAndSortedGyms.length === 1 ? 'gym' : 'gyms'}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
              {searchingGyms && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
            <div className="grid gap-3 w-full">
              {displayedGyms.map((gym) => (
                <Card 
                  key={gym.id} 
                  className="hover:shadow-card transition-all duration-300 cursor-pointer w-full"
                  onClick={() => navigate(`/gym/${gym.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3 w-full min-w-0">
                      {gym.photo_url && (
                        <img 
                          src={gym.photo_url} 
                          alt={gym.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate max-w-full">{gym.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          {gym.rating && (
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <Star className="w-3 h-3 fill-warning text-warning flex-shrink-0" />
                              <span>{gym.rating}</span>
                            </div>
                          )}
                          {gym.user_ratings_total && (
                            <>
                              <span className="text-muted-foreground/50 flex-shrink-0">•</span>
                              <span className="flex-shrink-0">({gym.user_ratings_total})</span>
                            </>
                          )}
                          {gym.distance !== null && (
                            <>
                              <span className="text-muted-foreground/50 flex-shrink-0">•</span>
                              <span className="flex-shrink-0">{formatDistance(gym.distance)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-4">
              {hasMoreGyms && (
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setDisplayLimit(prev => prev + 10)}
                >
                  Show More Gyms
                </Button>
              )}
              <Button 
                variant="outline" 
                size="lg" 
                onClick={fetchNearbyGyms} 
                disabled={loadingGyms}
              >
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
