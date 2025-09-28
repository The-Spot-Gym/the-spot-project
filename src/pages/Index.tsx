import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, Trophy, Dumbbell, User, Star, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import Welcome from "./Welcome";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);

  // Fetch user profile when authenticated - MUST be before any early returns
  useEffect(() => {
    if (user) {
      // TODO: Fetch user profile from Supabase
      setUserProfile({ username: 'User', display_name: 'Fitness Enthusiast' });
    }
  }, [user]);

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
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const nearbyGyms = [
    {
      name: "Iron Paradise Gym",
      rating: 4.8,
      distance: "0.3 miles",
      members: 234,
      topLifter: "Mike Chen",
      topLift: "405 lbs deadlift",
      image: "🏋️"
    },
    {
      name: "FitCore Community",
      rating: 4.6,
      distance: "0.7 miles", 
      members: 189,
      topLifter: "Sarah J.",
      topLift: "275 lbs squat",
      image: "💪"
    },
    {
      name: "Strength United",
      rating: 4.9,
      distance: "1.2 miles",
      members: 312,
      topLifter: "Alex Rivera",
      topLift: "315 lbs bench",
      image: "🔥"
    }
  ];

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

        <div className="grid gap-6">
          {nearbyGyms.map((gym, index) => (
            <Card 
              key={index} 
              className="hover:shadow-card transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/gym/${gym.name.toLowerCase().replace(/\s+/g, '-')}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{gym.image}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{gym.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-warning text-warning" />
                            <span>{gym.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{gym.distance}</span>
                          <span>•</span>
                          <span>{gym.members} members</span>
                        </div>
                      </div>
                      <Button variant="fitness">
                        Join Gym
                      </Button>
                    </div>
                    
                    <div className="bg-muted rounded-lg p-3 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-accent" />
                        <span className="font-medium">Top Lifter:</span>
                        <span>{gym.topLifter}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-semibold text-accent">{gym.topLift}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" size="lg">
            Load More Gyms
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;