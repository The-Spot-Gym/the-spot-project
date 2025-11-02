import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2, Plus, Flame, Trash2, TrendingUp, Calendar, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { workoutService } from "@/services/workoutService";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { EXERCISES } from "@/constants/exercises";
import { ROUTES } from "@/constants/routes";
import Welcome from "./Welcome";
import type { WorkoutSession, LeaderboardStats } from "@/types";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const [streakData, setStreakData] = useState<LeaderboardStats | null>(null);
  const [currentExercise, setCurrentExercise] = useState({
    exercise: "",
    weight: "",
    reps: "",
    sets: ""
  });
  const [exercisesInSession, setExercisesInSession] = useState<any[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [saving, setSaving] = useState(false);

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

  const addExerciseToSession = () => {
    if (!currentExercise.exercise || !currentExercise.weight || !currentExercise.reps || !currentExercise.sets) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to add an exercise.",
        variant: "destructive",
      });
      return;
    }

    setExercisesInSession([...exercisesInSession, { ...currentExercise }]);
    setCurrentExercise({ exercise: "", weight: "", reps: "", sets: "" });
    toast({
      title: "Exercise added!",
      description: `${currentExercise.exercise} added to your workout.`,
    });
  };

  const removeExerciseFromSession = (index: number) => {
    setExercisesInSession(exercisesInSession.filter((_, i) => i !== index));
  };

  const handleLogWorkout = async () => {
    if (!user) return;

    if (exercisesInSession.length === 0) {
      toast({
        title: "No exercises added",
        description: "Please add at least one exercise to your workout.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Create workout session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          session_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Insert all exercises
      const exercisesToInsert = exercisesInSession.map(ex => ({
        session_id: session.id,
        exercise_name: ex.exercise,
        weight: parseFloat(ex.weight),
        reps: parseInt(ex.reps),
        sets: parseInt(ex.sets)
      }));

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;

      // Also create weight_records for backward compatibility with streak tracking
      const { error: weightError } = await supabase
        .from('weight_records')
        .insert({
          user_id: user.id,
          weight: parseFloat(exercisesInSession[0].weight),
          notes: `Workout: ${exercisesInSession.map(e => e.exercise).join(', ')}`
        });

      if (weightError) throw weightError;

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
        description: `Great job! Logged ${exercisesInSession.length} exercises! 💪`,
      });

      // Reset form and refresh data
      setExercisesInSession([]);
      setCurrentExercise({ exercise: "", weight: "", reps: "", sets: "" });
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
      <PageHeader
        title="The Spot"
        showMessagesButton
        showProfileMenu
        profile={profile}
        onSignOut={handleSignOut}
      />

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
                onClick={addExerciseToSession}
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
