import { useState, useEffect } from "react";
import { Loader2, MessageCircle, Trophy, Dumbbell, ChevronDown, ChevronUp, Copy, BookOpen, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Profile, LeaderboardStats, WorkoutSession, WorkoutExercise } from "@/types";

interface FriendProfileDialogProps {
  friend: Profile | null;
  onClose: () => void;
  onMessage: (friend: Profile) => void;
}

export const FriendProfileDialog = ({ friend, onClose, onMessage }: FriendProfileDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friendStats, setFriendStats] = useState<LeaderboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionExercises, setSessionExercises] = useState<Record<string, WorkoutExercise[]>>({});
  const [copying, setCopying] = useState(false);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [planExercises, setPlanExercises] = useState<Record<string, any[]>>({});
  const [friendGyms, setFriendGyms] = useState<any[]>([]);
  const [gymsLoading, setGymsLoading] = useState(false);

  useEffect(() => {
    if (!friend) {
      setFriendStats(null);
      setWorkouts([]);
      setExpandedSession(null);
      setSessionExercises({});
      setSavedPlans([]);
      setExpandedPlan(null);
      setPlanExercises({});
      setFriendGyms([]);
      return;
    }

    const fetchData = async () => {
      setStatsLoading(true);
      setWorkoutsLoading(true);
      setPlansLoading(true);
      setGymsLoading(true);

      const [statsRes, workoutsRes, plansRes, gymsRes] = await Promise.all([
        supabase
          .from('leaderboard_stats')
          .select('*')
          .eq('user_id', friend.user_id)
          .maybeSingle(),
        supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', friend.user_id)
          .order('session_date', { ascending: false })
          .limit(10),
        supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', friend.user_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('gym_memberships')
          .select('*, gyms(*)')
          .eq('user_id', friend.user_id)
          .eq('is_active', true),
      ]);

      setFriendStats(statsRes.data as LeaderboardStats | null);
      setStatsLoading(false);
      setWorkouts(workoutsRes.data || []);
      setWorkoutsLoading(false);
      setSavedPlans(plansRes.data || []);
      setPlansLoading(false);
      setFriendGyms(gymsRes.data || []);
      setGymsLoading(false);
    };

    fetchData();
  }, [friend]);

  const togglePlan = async (planId: string) => {
    if (expandedPlan === planId) {
      setExpandedPlan(null);
      return;
    }
    setExpandedPlan(planId);

    if (!planExercises[planId]) {
      const { data } = await supabase
        .from('workout_plan_exercises')
        .select('*')
        .eq('plan_id', planId)
        .order('order_index', { ascending: true });

      setPlanExercises(prev => ({ ...prev, [planId]: data || [] }));
    }
  };

  const toggleSession = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    setExpandedSession(sessionId);

    if (!sessionExercises[sessionId]) {
      const { data } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      setSessionExercises(prev => ({ ...prev, [sessionId]: data || [] }));
    }
  };

  const copyWorkout = async (sessionId: string) => {
    if (!user || copying) return;
    const exercises = sessionExercises[sessionId];
    if (!exercises || exercises.length === 0) return;

    setCopying(true);
    try {
      const { data: newSession, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          session_date: new Date().toISOString().split('T')[0],
          notes: `Copied from ${friend?.display_name || friend?.username || 'friend'}`,
        })
        .select()
        .single();

      if (sessionError || !newSession) throw sessionError;

      const { error: exError } = await supabase
        .from('workout_exercises')
        .insert(
          exercises.map(ex => ({
            session_id: newSession.id,
            exercise_name: ex.exercise_name,
            weight: ex.weight,
            reps: ex.reps,
            sets: ex.sets,
          }))
        );

      if (exError) throw exError;

      toast({ title: "Workout copied!", description: "The workout has been added to your sessions." });
    } catch {
      toast({ title: "Error", description: "Failed to copy workout.", variant: "destructive" });
    } finally {
      setCopying(false);
    }
  };

  const formatWeight = (weight: number | null) => {
    if (!weight) return "0";
    return weight >= 1000 ? `${(weight / 1000).toFixed(1)}k` : String(weight);
  };

  const getPersonalRecords = (stats: LeaderboardStats | null) => {
    if (!stats?.personal_records) return null;
    const pr = stats.personal_records as Record<string, number>;
    return { bench: pr.bench_press || 0, squat: pr.squat || 0, deadlift: pr.deadlift || 0 };
  };

  const displayName = friend?.display_name || friend?.username || 'Anonymous';

  return (
    <Dialog open={!!friend} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        {friend && (
          <ScrollArea className="flex-1 -mx-6 px-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
            <div className="space-y-6 pb-4">
              {/* Profile Header */}
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={friend.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{displayName}</h2>
                  {friend.display_name && friend.username && (
                    <p className="text-sm text-muted-foreground">@{friend.username}</p>
                  )}
                  {friend.bio && (
                    <p className="text-sm text-muted-foreground mt-1">{friend.bio}</p>
                  )}
                </div>
              </div>

              {/* Lift Stats */}
              {statsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : friendStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{friendStats.total_workouts || 0}</p>
                      <p className="text-xs text-muted-foreground">Workouts</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{friendStats.current_streak || 0}</p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{formatWeight(friendStats.total_weight_lifted)}</p>
                      <p className="text-xs text-muted-foreground">lbs lifted</p>
                    </div>
                  </div>

                  {(() => {
                    const pr = getPersonalRecords(friendStats);
                    if (!pr || (pr.bench === 0 && pr.squat === 0 && pr.deadlift === 0)) return null;
                    return (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-warning" />
                          Personal Records
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {pr.bench > 0 && (
                            <div className="border rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold">{pr.bench}</p>
                              <p className="text-xs text-muted-foreground">Bench</p>
                            </div>
                          )}
                          {pr.squat > 0 && (
                            <div className="border rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold">{pr.squat}</p>
                              <p className="text-xs text-muted-foreground">Squat</p>
                            </div>
                          )}
                          {pr.deadlift > 0 && (
                            <div className="border rounded-lg p-2.5 text-center">
                              <p className="text-lg font-bold">{pr.deadlift}</p>
                              <p className="text-xs text-muted-foreground">Deadlift</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {friendStats.favorite_exercise && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Dumbbell className="w-4 h-4" />
                      Favorite: <span className="font-medium text-foreground">{friendStats.favorite_exercise}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No workout stats yet</p>
              )}

              {/* Gyms */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  Gyms
                </h3>
                {gymsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : friendGyms.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No gyms joined yet</p>
                ) : (
                  <div className="space-y-2">
                    {friendGyms.map((membership: any) => (
                      <div key={membership.id} className="flex items-center gap-3 p-2.5 border rounded-lg">
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{membership.gyms?.name}</p>
                          {membership.gyms?.address && (
                            <p className="text-xs text-muted-foreground truncate">{membership.gyms.address}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Workouts */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4" />
                  Recent Workouts
                </h3>
                {workoutsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : workouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No workouts yet</p>
                ) : (
                  <div className="space-y-2">
                    {workouts.map((workout) => (
                      <div key={workout.id} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                          onClick={() => toggleSession(workout.id)}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {new Date(workout.session_date).toLocaleDateString()}
                            </p>
                            {workout.notes && (
                              <p className="text-xs text-muted-foreground truncate">{workout.notes}</p>
                            )}
                          </div>
                          {expandedSession === workout.id ? (
                            <ChevronUp className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          )}
                        </button>

                        {expandedSession === workout.id && (
                          <div className="border-t px-3 pb-3 pt-2 space-y-2">
                            {!sessionExercises[workout.id] ? (
                              <div className="flex justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : sessionExercises[workout.id].length === 0 ? (
                              <p className="text-xs text-muted-foreground">No exercises recorded</p>
                            ) : (
                              <>
                                {sessionExercises[workout.id].map((ex) => (
                                  <div key={ex.id} className="flex justify-between text-sm">
                                    <span className="font-medium">{ex.exercise_name}</span>
                                    <span className="text-muted-foreground">
                                      {ex.sets}×{ex.reps} @ {ex.weight}lbs
                                    </span>
                                  </div>
                                ))}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2"
                                  disabled={copying}
                                  onClick={() => copyWorkout(workout.id)}
                                >
                                  {copying ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Copy className="w-3 h-3 mr-1" />
                                  )}
                                  Copy Workout
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved Workout Plans */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Saved Workout Plans
                </h3>
                {plansLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : savedPlans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No saved plans yet</p>
                ) : (
                  <div className="space-y-2">
                    {savedPlans.map((plan) => (
                      <div key={plan.id} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                          onClick={() => togglePlan(plan.id)}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{plan.name}</p>
                            {plan.description && (
                              <p className="text-xs text-muted-foreground truncate">{plan.description}</p>
                            )}
                          </div>
                          {expandedPlan === plan.id ? (
                            <ChevronUp className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                          )}
                        </button>

                        {expandedPlan === plan.id && (
                          <div className="border-t px-3 pb-3 pt-2 space-y-2">
                            {!planExercises[plan.id] ? (
                              <div className="flex justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : planExercises[plan.id].length === 0 ? (
                              <p className="text-xs text-muted-foreground">No exercises in this plan</p>
                            ) : (
                              planExercises[plan.id].map((ex: any) => (
                                <div key={ex.id} className="flex justify-between text-sm">
                                  <span className="font-medium">{ex.exercise_name}</span>
                                  <span className="text-muted-foreground">
                                    {ex.sets}×{ex.reps} @ {ex.weight}lbs
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="fitness"
                className="w-full"
                onClick={() => {
                  onClose();
                  onMessage(friend);
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
