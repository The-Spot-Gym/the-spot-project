import { useNavigate } from "react-router-dom";
import { MapPin, Users, Trophy, Dumbbell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import heroImage from "@/assets/hero-realistic-gym.jpg";

const Welcome = () => {
  const navigate = useNavigate();

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
              <h1 className="text-5xl font-bold mb-2">The Spot</h1>
              <p className="text-xl opacity-90">Find Your Gym. Find Your Spot.</p>
            </div>
          </div>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Connect with gym-goers near you, track your progress, and stay motivated with a community that gets it.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate('/auth')}
              className="bg-white text-primary hover:bg-white/90"
            >
              <User className="mr-2" />
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="xl"
              className="border-white text-white hover:bg-white hover:text-primary bg-white/10 backdrop-blur-sm"
              onClick={() => navigate('/auth')}
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
};

export default Welcome;