import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Dumbbell, User, LogOut, Loader2, Settings, MessageCircle, UserPlus, Plus, TrendingUp, Calendar, Save, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [streakData, setStreakData] = useState<any>(null);
  const [workoutLog, setWorkoutLog] = useState({
    exercise: "",
    weight: "",
    reps: "",
    sets: ""
  });
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

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
          setUserProfile({ 
            username: user.user_metadata?.username || 'User', 
            display_name: user.user_metadata?.display_name || user.user_metadata?.full_name || 'Fitness Enthusiast'
          });
        }
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch streak and workout data
  useEffect(() => {
    if (user) {
      fetchStreakData();
      fetchRecentWorkouts();
    }
  }, [user]);

  const fetchStreakData = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('leaderboard_stats')
      .select('current_streak, longest_streak, total_workouts')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setStreakData(data);
    }
  };

  const fetchRecentWorkouts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('weight_records')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentWorkouts(data);
    }
  };

  const handleLogWorkout = async () => {
    if (!user || !workoutLog.exercise || !workoutLog.weight || !workoutLog.reps || !workoutLog.sets) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to log your workout.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Save workout record
      const { error } = await supabase
        .from('weight_records')
        .insert({
          user_id: user.id,
          weight: parseFloat(workoutLog.weight),
          notes: `${workoutLog.exercise} - ${workoutLog.sets} sets x ${workoutLog.reps} reps`
        });

      if (error) throw error;

      // Update total workouts
      const { error: statsError } = await supabase
        .from('leaderboard_stats')
        .update({
          total_workouts: (streakData?.total_workouts || 0) + 1
        })
        .eq('user_id', user.id);

      if (statsError) throw statsError;

      toast({
        title: "Workout logged!",
        description: "Great job! Keep up the momentum! 💪",
      });

      // Reset form and refresh data
      setWorkoutLog({ exercise: "", weight: "", reps: "", sets: "" });
      fetchStreakData();
      fetchRecentWorkouts();
    } catch (error: any) {
      console.error('Error logging workout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to log workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
    return null;
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
            <span className="font-bold text-xl">The Spot</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
              <MessageCircle className="w-5 h-5" />
            </Button>
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
                <DropdownMenuItem onClick={() => navigate('/my-gyms')}>
                  <MapPin className="w-4 h-4 mr-2" />
                  My Gyms
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/messages')}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/friend-requests')}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Friend Requests
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile-setup')}>
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
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
          <h1 className="text-3xl font-bold mb-2">Workout Logger</h1>
          <p className="text-muted-foreground">Track your progress and stay motivated</p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 mb-8">
          <Button 
            variant="fitness" 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/gyms-near-you')}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Find Gyms Near You
          </Button>
        </div>

        {/* Streak Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-primary text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Current Streak</p>
                  <p className="text-3xl font-bold mt-1">{streakData?.current_streak || 0}</p>
                  <p className="text-xs opacity-75 mt-1">days</p>
                </div>
                <Flame className="w-12 h-12 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Longest Streak</p>
                  <p className="text-3xl font-bold mt-1">{streakData?.longest_streak || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">days</p>
                </div>
                <TrendingUp className="w-12 h-12 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Workouts</p>
                  <p className="text-3xl font-bold mt-1">{streakData?.total_workouts || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">completed</p>
                </div>
                <Calendar className="w-12 h-12 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Log Workout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log Today's Workout</CardTitle>
              <CardDescription>Track your exercises to maintain your streak</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise">Exercise</Label>
                <Select 
                  value={workoutLog.exercise} 
                  onValueChange={(value) => setWorkoutLog(prev => ({ ...prev, exercise: value }))}
                >
                  <SelectTrigger id="exercise">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bench Press">Bench Press</SelectItem>
                    <SelectItem value="Squat">Squat</SelectItem>
                    <SelectItem value="Deadlift">Deadlift</SelectItem>
                    <SelectItem value="Overhead Press">Overhead Press</SelectItem>
                    <SelectItem value="Barbell Row">Barbell Row</SelectItem>
                    <SelectItem value="Pull-ups">Pull-ups</SelectItem>
                    <SelectItem value="Dips">Dips</SelectItem>
                    <SelectItem value="Leg Press">Leg Press</SelectItem>
                    <SelectItem value="Lat Pulldown">Lat Pulldown</SelectItem>
                    <SelectItem value="Cable Flyes">Cable Flyes</SelectItem>
                    <SelectItem value="Leg Curl">Leg Curl</SelectItem>
                    <SelectItem value="Leg Extension">Leg Extension</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="135"
                    value={workoutLog.weight}
                    onChange={(e) => setWorkoutLog(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    placeholder="10"
                    value={workoutLog.reps}
                    onChange={(e) => setWorkoutLog(prev => ({ ...prev, reps: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    placeholder="3"
                    value={workoutLog.sets}
                    onChange={(e) => setWorkoutLog(prev => ({ ...prev, sets: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleLogWorkout} 
                disabled={saving}
                className="w-full"
                variant="fitness"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Log Workout
              </Button>
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your last 5 logged workouts</CardDescription>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">No workouts logged yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start logging to track your progress!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentWorkouts.map((workout) => (
                    <div key={workout.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{workout.notes}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {workout.weight} lbs
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(workout.recorded_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
