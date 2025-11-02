import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2, Plus, Flame, Trash2, TrendingUp, Calendar, Dumbbell, MessageCircle, UserPlus, Users, User, Settings as SettingsIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { workoutService } from "@/services/workoutService";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { EXERCISES } from "@/constants/exercises";
import { ROUTES } from "@/constants/routes";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import Welcome from "./Welcome";
import type { WorkoutSession, LeaderboardStats } from "@/types";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const [streakData, setStreakData] = useState<LeaderboardStats | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);

  const {
    currentExercise,
    setCurrentExercise,
    exercisesInSession,
    saving,
    addExerciseToSession,
    removeExerciseFromSession,
    logWorkout,
  } = useWorkoutLogger(user?.id);

  const loading = authLoading || profileLoading;

  // Fetch streak data when authenticated
  useEffect(() => {
    const fetchStreakData = async () => {
      if (user) {
        const data = await workoutService.getStats();
        setStreakData(data);
      }
    };

    fetchStreakData();

    // Set up real-time subscription for leaderboard stats
    if (user) {
      const channel = supabase
        .channel('stats-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leaderboard_stats',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchStreakData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Fetch recent workouts
  useEffect(() => {
    const fetchRecentWorkouts = async () => {
      if (user) {
        const data = await workoutService.getRecentSessions(5);
        setRecentWorkouts(data);
      }
    };

    fetchRecentWorkouts();
  }, [user]);

  const fetchStreakData = async () => {
    if (!user) return;
    const data = await workoutService.getStats();
    setStreakData(data);
  };

  const fetchRecentWorkouts = async () => {
    if (!user) return;
    const data = await workoutService.getRecentSessions(5);
    setRecentWorkouts(data);
  };

  const handleAddExercise = () => {
    addExerciseToSession();
  };

  const handleLogWorkout = async () => {
    const success = await logWorkout();
    if (success) {
      fetchStreakData();
      fetchRecentWorkouts();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.AUTH);
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
      {/* Custom Header with Logo and Full Menu */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl">The Spot</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(ROUTES.MESSAGES)}
              className="flex-shrink-0"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>

            {profile && (
              <>
                <Badge variant="secondary" className="hidden sm:flex">
                  Welcome {profile.display_name || profile.username || 'User'}!
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full flex-shrink-0">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                        <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{profile.display_name || profile.username || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(ROUTES.MY_GYMS)}>
                      <MapPin className="mr-2 h-4 w-4" />
                      My Gyms
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.MESSAGES)}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.FRIEND_REQUESTS)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Friend Requests
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.FRIEND_RECOMMENDATIONS)}>
                      <Users className="mr-2 h-4 w-4" />
                      Find Friends
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE_SETUP)}>
                      <User className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)}>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
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
            onClick={() => navigate(ROUTES.GYMS_NEAR_YOU)}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Find Gyms Near You
          </Button>
        </div>

        {/* Streak Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Current Streak"
            value={streakData?.current_streak || 0}
            sublabel="days"
            icon={Flame}
            variant="primary"
          />
          <StatCard
            label="Longest Streak"
            value={streakData?.longest_streak || 0}
            sublabel="days"
            icon={TrendingUp}
          />
          <StatCard
            label="Total Workouts"
            value={streakData?.total_workouts || 0}
            sublabel="completed"
            icon={Calendar}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Log Workout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log Today's Workout</CardTitle>
              <CardDescription>Add multiple exercises to create a complete workout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise">Exercise</Label>
                <Select 
                  value={currentExercise.exercise} 
                  onValueChange={(value) => setCurrentExercise(prev => ({ ...prev, exercise: value }))}
                >
                  <SelectTrigger id="exercise">
                    <SelectValue placeholder="Select exercise" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {EXERCISES.map(exercise => (
                      <SelectItem key={exercise} value={exercise}>{exercise}</SelectItem>
                    ))}
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
                    value={currentExercise.weight}
                    onChange={(e) => setCurrentExercise(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    placeholder="10"
                    value={currentExercise.reps}
                    onChange={(e) => setCurrentExercise(prev => ({ ...prev, reps: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    placeholder="3"
                    value={currentExercise.sets}
                    onChange={(e) => setCurrentExercise(prev => ({ ...prev, sets: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleAddExercise}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>

              {/* Current Session Exercises */}
              {exercisesInSession.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Exercises in this workout ({exercisesInSession.length})</Label>
                  <div className="space-y-2">
                    {exercisesInSession.map((ex, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{ex.exercise}</p>
                          <p className="text-xs text-muted-foreground">
                            {ex.sets} sets × {ex.reps} reps @ {ex.weight} lbs
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeExerciseFromSession(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleLogWorkout} 
                disabled={saving || exercisesInSession.length === 0}
                className="w-full"
                variant="fitness"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Complete Workout {exercisesInSession.length > 0 && `(${exercisesInSession.length} exercises)`}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your last 5 workout sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <EmptyState
                  icon={Dumbbell}
                  title="No workouts logged yet"
                  description="Start logging to track your progress!"
                />
              ) : (
                <div className="space-y-4">
                  {recentWorkouts.map((workout) => (
                    <div key={workout.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">
                          {new Date(workout.session_date).toLocaleDateString()}
                        </p>
                      </div>
                      {workout.notes && (
                        <p className="text-sm text-muted-foreground">{workout.notes}</p>
                      )}
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
