import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Flame, TrendingUp, Calendar, Dumbbell, MessageCircle, UserPlus, Users, User, Settings as SettingsIcon, LogOut, Shield, Star, ClipboardList, Menu, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { workoutService } from "@/services/workoutService";
import { ROUTES } from "@/constants/routes";
import { useNotificationCounts } from "@/hooks/useNotificationCounts";
import { useWorkoutLogger } from "@/hooks/useWorkoutLogger";
import { RecentWorkouts } from "@/components/workout/RecentWorkouts";
import { RestTimer } from "@/components/workout/RestTimer";
import { LoadingState } from "@/components/LoadingState";
import Welcome from "./Welcome";
import type { WorkoutSession, LeaderboardStats } from "@/types";
import { useAdminRole } from "@/hooks/useAdminRole";
import { usePartneredGyms } from "@/hooks/usePartneredGym";
import { EXERCISES } from "@/constants/exercises";

const CUSTOM_EXERCISE_VALUE = "__custom__";

type TabKey = "log" | "workouts" | "gyms" | "more";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { unreadMessages, pendingFriendRequests } = useNotificationCounts();
  const [streakData, setStreakData] = useState<LeaderboardStats | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const { isAdmin } = useAdminRole();
  const { gyms: partneredGyms } = usePartneredGyms();
  const [activeTab, setActiveTab] = useState<TabKey>("log");
  const [isCustomExercise, setIsCustomExercise] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState("");

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

  useEffect(() => {
    const fetchStreakData = async () => {
      if (user) {
        const data = await workoutService.getStats();
        setStreakData(data);
      }
    };
    fetchStreakData();
    if (user) {
      const channel = supabase
        .channel('stats-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_stats', filter: `user_id=eq.${user.id}` }, () => { fetchStreakData(); })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      workoutService.getRecentSessions(5).then(setRecentWorkouts);
    }
  }, [user]);

  const fetchStreakData = async () => {
    if (!user) return;
    setStreakData(await workoutService.getStats());
  };

  const fetchRecentWorkouts = async () => {
    if (!user) return;
    setRecentWorkouts(await workoutService.getRecentSessions(5));
  };

  const handleLogWorkout = async () => {
    const success = await logWorkout();
    if (success) { fetchStreakData(); fetchRecentWorkouts(); }
  };

  const handleSignOut = async () => { await signOut(); navigate(ROUTES.AUTH); };

  const handleExerciseSelect = (value: string) => {
    if (value === CUSTOM_EXERCISE_VALUE) {
      setIsCustomExercise(true);
      setCustomExerciseName("");
      setCurrentExercise({ ...currentExercise, exercise: "" });
    } else {
      setIsCustomExercise(false);
      setCurrentExercise({ ...currentExercise, exercise: value });
    }
  };

  if (!loading && !user) return <Welcome />;
  if (loading) return <LoadingState message="Loading..." fullScreen />;
  if (!user) return null;
  if (user && !profileLoading && !profile?.username) {
    navigate(ROUTES.PROFILE_SETUP, { replace: true });
    return <LoadingState message="Setting up your profile..." fullScreen />;
  }

  const totalNotifications = unreadMessages + pendingFriendRequests;

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Safe area spacer */}
      <div className="h-safe-top bg-background shrink-0" />

      {/* Compact Header */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur z-50">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-secondary rounded-full flex items-center justify-center">
              <Dumbbell className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-lg">The Spot</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => navigate(ROUTES.MESSAGES)}>
              <MessageCircle className="h-4 w-4" />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </Button>
            {profile && (
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0" onClick={() => navigate(ROUTES.SETTINGS)}>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{profile.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Tab Content - fills remaining space */}
      <main className="flex-1 overflow-y-auto min-h-0">
        {/* LOG TAB */}
        {activeTab === "log" && (
          <div className="p-3 space-y-3 max-w-lg mx-auto">
            {/* Compact Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gradient-primary text-white rounded-lg p-2 text-center">
                <p className="text-[10px] opacity-80">Streak</p>
                <p className="text-lg font-bold leading-tight">{streakData?.current_streak || 0}</p>
              </div>
              <div className="bg-card border rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Best</p>
                <p className="text-lg font-bold leading-tight">{streakData?.longest_streak || 0}</p>
              </div>
              <div className="bg-card border rounded-lg p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Total</p>
                <p className="text-lg font-bold leading-tight">{streakData?.total_workouts || 0}</p>
              </div>
            </div>

            {/* Compact Workout Form */}
            <div className="bg-card border rounded-lg p-3 space-y-2.5">
              <h2 className="font-semibold text-sm">Log Workout</h2>
              
              {isCustomExercise ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Exercise name"
                    value={customExerciseName}
                    onChange={(e) => { setCustomExerciseName(e.target.value); setCurrentExercise({ ...currentExercise, exercise: e.target.value }); }}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => { setIsCustomExercise(false); setCustomExerciseName(""); setCurrentExercise({ ...currentExercise, exercise: "" }); }}>Cancel</Button>
                </div>
              ) : (
                <Select value={currentExercise.exercise} onValueChange={handleExerciseSelect}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select exercise" /></SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    <SelectItem value={CUSTOM_EXERCISE_VALUE} className="font-medium text-primary text-sm">✏️ Custom exercise...</SelectItem>
                    {EXERCISES.map(ex => <SelectItem key={ex} value={ex} className="text-sm">{ex}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Weight (lbs)</Label>
                  <Input type="number" placeholder="135" value={currentExercise.weight} onChange={(e) => setCurrentExercise({ ...currentExercise, weight: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Reps</Label>
                  <Input type="number" placeholder="10" value={currentExercise.reps} onChange={(e) => setCurrentExercise({ ...currentExercise, reps: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Sets</Label>
                  <Input type="number" placeholder="3" value={currentExercise.sets} onChange={(e) => setCurrentExercise({ ...currentExercise, sets: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>

              <Button onClick={addExerciseToSession} variant="outline" size="sm" className="w-full h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Exercise
              </Button>

              {/* Session Exercises */}
              {exercisesInSession.length > 0 && (
                <div className="space-y-1.5 border-t pt-2">
                  <p className="text-xs text-muted-foreground font-medium">{exercisesInSession.length} exercise{exercisesInSession.length > 1 ? 's' : ''}</p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {exercisesInSession.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-muted rounded text-xs">
                        <div>
                          <span className="font-medium">{ex.exercise}</span>
                          <span className="text-muted-foreground ml-2">{ex.sets}×{ex.reps} @ {ex.weight}lbs</span>
                        </div>
                        <button onClick={() => removeExerciseFromSession(i)} className="text-destructive hover:text-destructive/80 p-0.5">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleLogWorkout} disabled={saving || exercisesInSession.length === 0} variant="fitness" size="sm" className="w-full h-9 text-sm">
                {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Complete Workout {exercisesInSession.length > 0 && `(${exercisesInSession.length})`}
              </Button>
            </div>

            <RestTimer />
          </div>
        )}

        {/* WORKOUTS TAB */}
        {activeTab === "workouts" && (
          <div className="p-3 max-w-lg mx-auto">
            <RecentWorkouts workouts={recentWorkouts} onWorkoutDeleted={fetchRecentWorkouts} />
          </div>
        )}

        {/* GYMS TAB */}
        {activeTab === "gyms" && (
          <div className="p-3 space-y-3 max-w-lg mx-auto">
            <Button variant="fitness" size="sm" className="w-full h-9" onClick={() => navigate(ROUTES.GYMS_NEAR_YOU)}>
              <MapPin className="w-4 h-4 mr-2" /> Find Gyms Near You
            </Button>
            <Button variant="outline" size="sm" className="w-full h-9" onClick={() => navigate(ROUTES.MY_GYMS)}>
              <MapPin className="w-4 h-4 mr-2" /> My Gyms
            </Button>

            {partneredGyms.length > 0 && (
              <>
                <h2 className="text-sm font-semibold flex items-center gap-1.5 pt-1">
                  <Star className="w-4 h-4 text-primary" /> Partner Gyms
                </h2>
                <div className="space-y-2">
                  {partneredGyms.map(gym => (
                    <Card key={gym.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(ROUTES.PARTNERED_GYM(gym.id))}>
                      <CardContent className="p-3 flex items-center gap-3">
                        {gym.image_url ? (
                          <img src={gym.image_url} alt={gym.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg">🏋️</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-sm truncate">{gym.name}</h3>
                            <Badge variant="secondary" className="text-[9px] shrink-0">Partner</Badge>
                          </div>
                          {gym.description && <p className="text-xs text-muted-foreground truncate">{gym.description}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* MORE TAB */}
        {activeTab === "more" && (
          <div className="p-3 space-y-1 max-w-lg mx-auto">
            {profile && (
              <div className="flex items-center gap-3 p-3 mb-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>{profile.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{profile.display_name || profile.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            )}
            <MenuItem icon={Dumbbell} label="Workout Plans" onClick={() => navigate(ROUTES.WORKOUT_PLANS)} />
            <MenuItem icon={MessageCircle} label="Messages" badge={unreadMessages} onClick={() => navigate(ROUTES.MESSAGES)} />
            <MenuItem icon={UserPlus} label="Friend Requests" badge={pendingFriendRequests} onClick={() => navigate(ROUTES.FRIEND_REQUESTS)} />
            <MenuItem icon={Users} label="My Friends" onClick={() => navigate(ROUTES.MY_FRIENDS)} />
            <MenuItem icon={UserPlus} label="Find Friends" onClick={() => navigate(ROUTES.FRIEND_RECOMMENDATIONS)} />
            <div className="border-t my-2" />
            <MenuItem icon={User} label="Edit Profile" onClick={() => navigate(ROUTES.SETTINGS)} />
            <MenuItem icon={SettingsIcon} label="Settings" onClick={() => navigate(ROUTES.SETTINGS)} />
            {isAdmin && <MenuItem icon={Shield} label="Admin Panel" onClick={() => navigate(ROUTES.ADMIN_PANEL)} />}
            <div className="border-t my-2" />
            <button onClick={handleSignOut} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 text-destructive text-sm">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="shrink-0 border-t bg-background/95 backdrop-blur z-50">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
          <TabButton icon={Dumbbell} label="Log" active={activeTab === "log"} onClick={() => setActiveTab("log")} />
          <TabButton icon={ClipboardList} label="Workouts" active={activeTab === "workouts"} onClick={() => setActiveTab("workouts")} />
          <TabButton icon={Star} label="Gyms" active={activeTab === "gyms"} onClick={() => setActiveTab("gyms")} />
          <TabButton icon={Menu} label="More" active={activeTab === "more"} onClick={() => setActiveTab("more")} badge={totalNotifications} />
        </div>
        <div className="pb-safe bg-background" />
      </nav>
    </div>
  );
};

const TabButton = ({ icon: Icon, label, active, onClick, badge }: { icon: any; label: string; active: boolean; onClick: () => void; badge?: number }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-0.5 py-1 px-4 rounded-lg transition-colors relative ${active ? 'text-primary' : 'text-muted-foreground'}`}>
    <Icon className="w-5 h-5" />
    <span className="text-[10px] font-medium">{label}</span>
    {!!badge && badge > 0 && (
      <span className="absolute top-0 right-2 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

const MenuItem = ({ icon: Icon, label, onClick, badge }: { icon: any; label: string; onClick: () => void; badge?: number }) => (
  <button onClick={onClick} className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 text-sm">
    <Icon className="w-4 h-4 text-muted-foreground" />
    <span className="flex-1 text-left">{label}</span>
    {!!badge && badge > 0 && (
      <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

export default Index;
