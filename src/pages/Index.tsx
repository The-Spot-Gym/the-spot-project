import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Flame, TrendingUp, Calendar, Dumbbell, MessageCircle, UserPlus, Users, User, Settings as SettingsIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { workoutService } from "@/services/workoutService";
import { StatCard } from "@/components/StatCard";
import { ROUTES } from "@/constants/routes";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import { WorkoutForm } from "@/components/workout/WorkoutForm";
import { RecentWorkouts } from "@/components/workout/RecentWorkouts";
import { LoadingState } from "@/components/LoadingState";
import Welcome from "./Welcome";
import type { WorkoutSession, LeaderboardStats } from "@/types";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
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
    return <LoadingState message="Loading..." fullScreen />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Custom Header with Logo and Full Menu */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-safe">
        <div className="flex h-14 items-center justify-between px-4">
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
                    <DropdownMenuItem onClick={() => navigate(ROUTES.WORKOUT_PLANS)}>
                      <Dumbbell className="mr-2 h-4 w-4" />
                      Workout Plans
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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

      <div className="max-w-6xl mx-auto p-4 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Workout Logger</h1>
          <p className="text-sm text-muted-foreground">Track your progress and stay motivated</p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 mb-6">
          <Button 
            variant="fitness" 
            size="default" 
            className="w-full"
            onClick={() => navigate(ROUTES.GYMS_NEAR_YOU)}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Find Gyms Near You
          </Button>
        </div>

        {/* Streak Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
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

        <div className="grid lg:grid-cols-2 gap-4">
          <WorkoutForm 
            currentExercise={currentExercise}
            exercisesInSession={exercisesInSession}
            saving={saving}
            onExerciseChange={setCurrentExercise}
            onAddExercise={handleAddExercise}
            onRemoveExercise={removeExerciseFromSession}
            onCompleteWorkout={handleLogWorkout}
          />
          <RecentWorkouts workouts={recentWorkouts} />
        </div>
      </div>
    </div>
  );
};

export default Index;
