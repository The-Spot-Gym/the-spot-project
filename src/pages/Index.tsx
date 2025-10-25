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
  const [currentExercise, setCurrentExercise] = useState({
    exercise: "",
    weight: "",
    reps: "",
    sets: ""
  });
  const [exercisesList, setExercisesList] = useState<any[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Comprehensive exercise list
  const availableExercises = [
    // Chest
    "Bench Press", "Incline Bench Press", "Decline Bench Press",
    "Dumbbell Bench Press", "Incline Dumbbell Press", "Decline Dumbbell Press",
    "Cable Flyes", "Dumbbell Flyes", "Pec Deck", "Push-ups",
    // Back
    "Deadlift", "Barbell Row", "T-Bar Row", "Dumbbell Row",
    "Lat Pulldown", "Pull-ups", "Chin-ups", "Seated Cable Row",
    "Face Pulls", "Shrugs",
    // Shoulders
    "Overhead Press", "Arnold Press", "Lateral Raises", "Front Raises",
    "Rear Delt Flyes", "Cable Lateral Raises", "Upright Row",
    // Legs
    "Squat", "Front Squat", "Leg Press", "Leg Extension",
    "Leg Curl", "Romanian Deadlift", "Lunges", "Bulgarian Split Squat",
    "Calf Raises", "Hack Squat",
    // Arms
    "Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl",
    "Tricep Dips", "Skull Crushers", "Tricep Pushdown", "Overhead Tricep Extension",
    "Cable Curls", "Concentration Curls",
    // Core
    "Planks", "Crunches", "Leg Raises", "Russian Twists", "Cable Crunches"
  ].sort();

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

    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        exercises:workout_exercises(*)
      `)
      .eq('user_id', user.id)
      .order('session_date', { ascending: false })
      .limit(5);

    if (sessions) {
      setRecentWorkouts(sessions);
    }
  };

  const handleAddExercise = () => {
    if (!currentExercise.exercise || !currentExercise.weight || !currentExercise.reps || !currentExercise.sets) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to add an exercise.",
        variant: "destructive",
      });
      return;
    }

    setExercisesList(prev => [...prev, {
      exercise_name: currentExercise.exercise,
      weight: parseFloat(currentExercise.weight),
      reps: parseInt(currentExercise.reps),
      sets: parseInt(currentExercise.sets)
    }]);

    setCurrentExercise({ exercise: "", weight: "", reps: "", sets: "" });
    
    toast({
      title: "Exercise added!",
      description: "Add more exercises or finish your workout.",
    });
  };

  const handleRemoveExercise = (index: number) => {
    setExercisesList(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinishWorkout = async () => {
    if (!user || exercisesList.length === 0) {
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
      const exercisesWithSessionId = exercisesList.map(ex => ({
        session_id: session.id,
        ...ex
      }));

      const { error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exercisesWithSessionId);

      if (exercisesError) throw exercisesError;

      // Also log in weight_records for streak tracking
      const totalWeight = exercisesList.reduce((sum, ex) => sum + (ex.weight * ex.sets * ex.reps), 0);
      await supabase
        .from('weight_records')
        .insert({
          user_id: user.id,
          weight: totalWeight,
          notes: `Workout: ${exercisesList.length} exercises`
        });

      // Update total workouts
      await supabase
        .from('leaderboard_stats')
        .update({
          total_workouts: (streakData?.total_workouts || 0) + 1
        })
        .eq('user_id', user.id);

      toast({
        title: "Workout completed!",
        description: `Great job! You completed ${exercisesList.length} exercises! 💪`,
      });

      // Reset and refresh
      setExercisesList([]);
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
              <CardDescription>Add exercises to your workout session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current exercises in session */}
              {exercisesList.length > 0 && (
                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Exercises in this workout:</p>
                    <Badge variant="secondary">{exercisesList.length} exercises</Badge>
                  </div>
                  <div className="space-y-2">
                    {exercisesList.map((ex, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ex.exercise_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ex.weight} lbs × {ex.sets} sets × {ex.reps} reps
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveExercise(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    {availableExercises.map((exercise) => (
                      <SelectItem key={exercise} value={exercise}>
                        {exercise}
                      </SelectItem>
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

              <div className="flex gap-2">
                <Button 
                  onClick={handleAddExercise}
                  variant="outline"
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exercise
                </Button>
                
                {exercisesList.length > 0 && (
                  <Button 
                    onClick={handleFinishWorkout} 
                    disabled={saving}
                    className="flex-1"
                    variant="fitness"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Finish Workout
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Workouts</CardTitle>
              <CardDescription>Your last 5 logged workout sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentWorkouts.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">No workouts logged yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start logging to track your progress!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentWorkouts.map((session) => (
                    <div key={session.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {new Date(session.session_date).toLocaleDateString()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {session.exercises?.length || 0} exercises
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {session.exercises?.map((exercise: any) => (
                          <div key={exercise.id} className="text-sm">
                            <p className="font-medium">{exercise.exercise_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {exercise.weight} lbs × {exercise.sets} sets × {exercise.reps} reps
                            </p>
                          </div>
                        ))}
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
