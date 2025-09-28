import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, Trophy, Dumbbell, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-fitness.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'welcome' | 'signup' | 'discover'>('welcome');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    if (username && password) {
      // Request location permission
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => navigate('/profile-setup'),
          () => navigate('/profile-setup') // Continue even if location denied
        );
      } else {
        navigate('/profile-setup');
      }
    }
  };

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

  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative mb-8 rounded-2xl overflow-hidden shadow-glow">
              <img 
                src={heroImage} 
                alt="Fitness community working out together"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <h1 className="text-5xl font-bold mb-2">FitConnect</h1>
                <p className="text-xl opacity-90">Find Your Gym. Find Your Tribe.</p>
              </div>
            </div>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Connect with gym-goers near you, track your progress, and stay motivated with a community that gets it.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => setCurrentView('signup')}
                className="bg-white text-primary hover:bg-white/90"
              >
                <User className="mr-2" />
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                className="border-white text-white hover:bg-white hover:text-primary"
              >
                <MapPin className="mr-2" />
                Find Gyms Near Me
              </Button>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-background/95 backdrop-blur-sm p-8">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center mb-2">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Find Your Gym</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Discover top-rated gyms nearby with real reviews from the community.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-accent rounded-full flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Connect & Motivate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Find workout buddies, share progress, and stay motivated together.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-2">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Compete & Grow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Track PRs, climb leaderboards, and celebrate achievements.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-glow bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mb-4">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Join FitConnect</CardTitle>
            <CardDescription>Create your account to start connecting with your fitness community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Username</label>
              <Input
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-muted focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-muted focus:border-primary"
              />
            </div>
            <Button 
              variant="hero" 
              className="w-full" 
              size="lg"
              onClick={handleSignup}
              disabled={!username || !password}
            >
              <MapPin className="mr-2" />
              Sign Up & Find Gyms
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              We'll ask for your location to find the best gyms near you
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-card p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">FitConnect</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Welcome {username}!</Badge>
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
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