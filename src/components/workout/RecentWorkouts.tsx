import { useState } from "react";
import { Dumbbell, ChevronDown, ChevronUp, Trash2, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/utils/date";
import { workoutService } from "@/services/workoutService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { WorkoutSession, WorkoutExercise } from "@/types";

interface RecentWorkoutsProps {
  workouts: WorkoutSession[];
  onWorkoutDeleted?: () => void;
  initialLimit?: number;
}

interface WorkoutItemProps {
  workout: WorkoutSession;
  onDeleted?: () => void;
}

interface SaveAsPlanDialogProps {
  exercises: WorkoutExercise[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SaveAsPlanDialog = ({ exercises, open, onOpenChange }: SaveAsPlanDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !name.trim() || exercises.length === 0) return;
    setSaving(true);
    try {
      const { data: plan, error: planError } = await supabase
        .from("workout_plans")
        .insert({ user_id: user.id, name: name.trim(), description: description.trim() || null })
        .select()
        .single();

      if (planError || !plan) throw planError;

      const { error: exError } = await supabase
        .from("workout_plan_exercises")
        .insert(
          exercises.map((ex, i) => ({
            plan_id: plan.id,
            exercise_name: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            order_index: i,
          }))
        );

      if (exError) throw exError;

      toast({ title: "Saved!", description: `"${name.trim()}" added to your workout plans.` });
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to save workout plan.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save as Workout Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="plan-name">Plan Name *</Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push Day, Leg Day"
            />
          </div>
          <div>
            <Label htmlFor="plan-desc">Description (optional)</Label>
            <Textarea
              id="plan-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes about this plan"
              rows={2}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} will be saved
          </div>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const WorkoutItem = ({ workout, onDeleted }: WorkoutItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { toast } = useToast();

  const toggleExpanded = async () => {
    if (!expanded && exercises.length === 0) {
      setLoadingExercises(true);
      const data = await workoutService.getSessionExercises(workout.id);
      setExercises(data);
      setLoadingExercises(false);
    }
    setExpanded(!expanded);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await supabase.from('workout_exercises').delete().eq('session_id', workout.id);
      const { error } = await supabase.from('workout_sessions').delete().eq('id', workout.id);
      if (error) throw error;
      toast({ title: "Workout deleted" });
      onDeleted?.();
    } catch {
      toast({ title: "Error", description: "Failed to delete workout.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={toggleExpanded}
          className="w-full p-4 flex justify-between items-center hover:bg-muted/50 transition-colors text-left"
        >
          <div className="space-y-1">
            <p className="font-medium">{formatDate(workout.session_date)}</p>
            {workout.notes && (
              <p className="text-sm text-muted-foreground">{workout.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="border-t bg-muted/30 p-4 space-y-3">
            {loadingExercises ? (
              <p className="text-sm text-muted-foreground">Loading exercises...</p>
            ) : exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">No exercises recorded</p>
            ) : (
              <div className="space-y-2">
                {exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 p-2 bg-background rounded-md"
                  >
                    <span className="font-medium text-sm">{exercise.exercise_name}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{exercise.sets} sets</span>
                      <span>×</span>
                      <span>{exercise.reps} reps</span>
                      <span>@</span>
                      <span className="font-medium text-foreground">{exercise.weight} lbs</span>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save as Workout Plan
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <SaveAsPlanDialog
        exercises={exercises}
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
      />
    </>
  );
};

export const RecentWorkouts = ({ workouts, onWorkoutDeleted }: RecentWorkoutsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Workouts</CardTitle>
        <CardDescription>Tap a workout to see exercises</CardDescription>
      </CardHeader>
      <CardContent>
        {workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts logged yet"
            description="Start logging to track your progress!"
          />
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <WorkoutItem key={workout.id} workout={workout} onDeleted={onWorkoutDeleted} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
