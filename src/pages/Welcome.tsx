import { useNavigate } from "react-router-dom";
import { MapPin, Users, Trophy, Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import heroImage from "@/assets/hero-realistic-gym.jpg";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header with Logo */}
      <header className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-secondary rounded-2xl flex items-center justify-center shadow-glow">
              <Dumbbell className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">The Spot</h2>
              <p className="text-sm opacity-80">Your Fitness Community</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative mb-8 rounded-3xl overflow-hidden shadow-glow">
            <img 
              src={heroImage} 
              alt="Fitness community working out together"
              className="w-full h-[450px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
              <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">Find Your Spot</h1>
              <p className="text-2xl opacity-90 mb-8 drop-shadow-md">Your fitness journey starts here</p>
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-white text-foreground hover:bg-white/90 text-lg px-8 py-6 rounded-2xl shadow-xl font-semibold"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features - Clickable Cards */}
      <div className="bg-background/95 backdrop-blur-sm p-8 pb-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">What You Can Do</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              className="bg-gradient-card border-0 shadow-card hover:shadow-xl transition-all cursor-pointer hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mb-3">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Find Your Gym</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Discover top-rated gyms nearby with real reviews from the community.</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-card border-0 shadow-card hover:shadow-xl transition-all cursor-pointer hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Connect & Motivate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Find workout buddies, share progress, and stay motivated together.</p>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-card border-0 shadow-card hover:shadow-xl transition-all cursor-pointer hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-3">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Compete & Grow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Track PRs, climb leaderboards, and celebrate achievements.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;